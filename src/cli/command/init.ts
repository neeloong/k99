import * as fsPromise from 'node:fs/promises';
import type { List as OptList } from '../opt';
import type opt from '../opt';

const configFileNames = ['k99.config.js', '.k99.config.js', 'k99.config.json', '.k99.config.json'];

const entryFile =
	`
const baseConfig = require('./.k99.config.json');
Object.assign(exports, baseConfig);
`;
export async function exec({ path }: opt, ...args: string[]) {
	if (path) {
		await fsPromise.mkdir(path, { recursive: true }).catch(() => { });
		process.chdir(path);
	}
	console.log('K99', '@', process.cwd());
	for (const n of configFileNames) {
		if (await fsPromise.stat(n).then(() => true, () => false)) {
			console.log(`The config (${ n }) is Existing.`);
			return;
		}
	}
	await fsPromise.writeFile('.k99.config.json', JSON.stringify({}, null, '\t'));
	await fsPromise.writeFile('k99.config.js', entryFile);
	const cfg = JSON.stringify(await fsPromise.readFile('package.json', 'utf-8').catch(() => { })) || { private: true } as any;
	if (!cfg.main) { cfg.main = 'node_modules/k99/starter'; }
	if (!cfg.scripts) { cfg.scripts = {}; }
	if (!cfg.scripts.start) { cfg.scripts.start = 'k99 --port=3000 start'; }
	if (!cfg.scripts.test) { cfg.scripts.test = 'node --inspect node_modules/k99/cli --port=3000 start'; }
	if (!cfg.dependencies) { cfg.dependencies = {}; }
	if (!cfg.dependencies.k99) { cfg.dependencies.k99 = '^__VERSION__'; }

	await fsPromise.writeFile('package.json', JSON.stringify(cfg, null, 2));
}

export const opts: OptList[] = ['path'];
export const argv = '';
export const explain = '初始化项目';
export async function help(...argv: string[]) { }
