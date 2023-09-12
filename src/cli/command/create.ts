import * as fsPromise from 'node:fs/promises';
import * as pathFn from 'path';
import type { RouterThis } from 'entry-cli';
import type { List as OptList } from '../opt';
import type opt from '../opt';
const entryFile = `
const baseConfig = require('./.k99.config.json');
Object.assign(exports, baseConfig);
`;
export async function exec(this: RouterThis, { path }: opt, name: string, ...args: string[]) {
	if (!(path || name)) { return this.help(); }

	// 创建目录
	if (await fsPromise.mkdir(path || name, { recursive: true }).then(v => false, e => true)) {
		console.error(`Error: Failed to create directory, mkdir '${ pathFn.resolve(path || name) }'`);
		return;
	}
	process.chdir(path || name);
	console.log('K99', '@', process.cwd());
	await fsPromise.writeFile('.k99.config.json', JSON.stringify({ name, version: '0.0.0' }, null, '\t'));
	await fsPromise.writeFile('k99.config.mjs', entryFile);

	// 创建测试目录
	if (await fsPromise.mkdir('test').then(v => true, e => false)) {
		await fsPromise.writeFile('test/.k99.config.json', JSON.stringify({ plugins: ['../'] }, null, '\t')).catch(e => console.warn(e));
		await fsPromise.writeFile('test/k99.config.mjs', entryFile).catch(e => console.warn(e));
	} else {
		console.warn(`Warn: Failed to create test directory, mkdir '${ pathFn.resolve('test') }'`);
	}
	await fsPromise.writeFile('package.json', JSON.stringify({
		name,
		version: '0.0.0',
		scripts: {
			start: 'k99 --path=test --port=3000 start',
			test: 'node --inspect node_modules/k99/cli --path=test --port=3000 start',
			dependencies: {
				k99: '^__VERSION__',
			},
		},
	}, null, 2));
}

export const opts: OptList[] = ['path'];
export const argv = '<name>';
export const explain = '创建插件';
export async function help(opt: opt, ...argv: string[]) { }
