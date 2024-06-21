import pathFn from 'node:path';
import childProcess from 'node:child_process';
import fsPromises from 'node:fs/promises';
import { rollup } from 'rollup';
import dts from 'rollup-plugin-dts';
import terser from '@rollup/plugin-terser';
import replace from '@rollup/plugin-replace';
const info = JSON.parse(await fsPromises.readFile('./src/package.json', 'utf-8'))
const {
	name, description, version, engines, dependencies, keywords,
	author, license, homepage, repository, bugs,
} = info;

console.log('移除 build 目录...');
await fsPromises.rm('build', { recursive: true }).catch(() =>{})
console.log('移除 build 目录...');
await fsPromises.rm('typings', { recursive: true }).catch(() =>{})
console.log('创建 build 目录...');
await fsPromises.mkdir('build', {recursive: true });
console.log('执行 tsc...');
childProcess.execSync('tsc -p tsconfig.json')
await fsPromises.writeFile(
	pathFn.resolve('typings/src/core/index.d.mts'),
	await fsPromises.readFile('src/core/index.d.mts'),
);
console.log('创建 build/package.json ...');
await fsPromises.writeFile('build/package.json', JSON.stringify({
	name, description, version, engines, dependencies, keywords,
	type: 'module', main: 'index.mjs',
	unpkg: './index.min.js', jsdelivr: './index.min.js',
	author, license, homepage, repository, bugs,
	exports: {
		".": {
			types: './index.d.ts',
			node:"./index.cjs",
			module: './index.mjs',
			unpkg: './index.min.js',
			jsdelivr: './index.min.js',
		},
		"./services": {
			types:"./services.d.ts",
			node:"./services.cjs",
			module: './services.mjs',
			unpkg: './services.min.js',
			jsdelivr: './services.min.js',
		},
		"./node": "./node/index.cjs"
	}
}, null, 2));


console.log('打包...');

const external = [
	...Object.keys(dependencies),
	'k99',
	'k99/node',
	'node:http',
	'node:http2',
	'node:stream',
	'http',
	'http2',
	'stream',
];
const globals = {
	'k99': 'k99',
	
}

const bYear = 2019;
const year = new Date().getFullYear();
const date = bYear === year ? bYear : `${ bYear }-${ year }`;
const banner = `\
/*!
 * k99 v${ version }
 * (c) ${ date } ${ author }
 * @license ${ license }
 */`;

function plugins() {
	const plugins = [
		replace({preventAssignment: true, values: { __VERSION__: version }}),
	];
	return plugins;
}

async function createBaseItem(id) {
	const inputName = `src/${ id }/index`
	const input = `${inputName}.mjs`;
	const dtsInput = `typings/src/${ id }/index.d.mts`;
	return [{ input, external, plugins: plugins(), output: [
		{ banner, file: `build/${ id }/index.cjs`, format: 'cjs' },
	]}, { input: dtsInput, external, plugins: [ dts() ], output: [
		{ format: 'esm', banner, file: `build/${ id }/index.d.cts` },
	] }];
}
async function createBrowserItem(id, name = 'k99') {
	const inputName = `src/${ id || 'core' }/index`
	const input = `${inputName}.mjs`;
	const dtsInput = `typings/src/${ id || 'core' }/index.d.mts`;
	const output = `build/${ id ? `${ id.toLowerCase() }` : 'index' }`;
	return [ { input, external, plugins: plugins(), output: [
		{ format: 'cjs', banner, file: `${ output }.cjs` },
		{ format: 'esm', banner, file: `${ output }.mjs` },
		{ format: 'umd', banner, file: `${ output }.js`, name, globals },
		{ format: 'esm', banner, file: `${ output }.min.mjs`, plugins: [terser()] },
		{ format: 'umd', banner, file: `${ output }.min.js`, plugins: [terser()], name, globals },
	] }, { input: dtsInput, external, plugins: [ dts() ], output: [
		{ format: 'esm', banner, file: `${ output }.d.ts` },
	] } ];
}

async function pack(cfg) {
	const bundle = await rollup(cfg);
	for (const output of cfg.output) {
		const file = output.file;
		console.log(`创建 ${output.file} ...`);
		const { output: [chunk] } = await bundle.generate(output);
		await fsPromises.mkdir(pathFn.dirname(file), {recursive: true})
		await fsPromises.writeFile(file, chunk.source || chunk.code || '');
	}
}

for (const k of await createBrowserItem()) {
	await pack(k);
}
for (const k of await createBrowserItem('services', 'k99Services')) {
	await pack(k);
}
for (const k of await createBaseItem('node')) {
	await pack(k);
}

console.log('复制文件...');
for (const file of await fsPromises.readdir('.', 'utf-8')) {
	if (/^(README|LICENSE)(\..+)?$/.test(file)) {
		console.log(`  ${file}...`);
		await fsPromises.writeFile(
			pathFn.resolve('build', file),
			await fsPromises.readFile(file),
		);
	}
}
console.log('完成');
