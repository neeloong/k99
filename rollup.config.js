import dts from 'rollup-plugin-dts';
import { terser } from 'rollup-plugin-terser';
import babel from '@rollup/plugin-babel';
import replace from '@rollup/plugin-replace';
import resolve from '@rollup/plugin-node-resolve';
import fsFn from 'fs';
import fsPromises from 'fs/promises';
import info from './package.json';
const {
	name, description, version, engines, dependencies, keywords,
	author, license, homepage, repository, bugs,
} = info;
try { fsFn.rmSync('build', { recursive: true }); } catch {}
fsFn.mkdirSync('build', {recursive: true});
fsPromises.writeFile('build/package.json', JSON.stringify({
	name, description, version, engines, dependencies, keywords,
	type: 'module', main: 'index.mjs',
	bin: {k99: 'cli.mjs', 'k99-start': 'starter.mjs'},
	unpkg: './index.min.js', jsdelivr: './index.min.js',
	author, license, homepage, repository, bugs,
}, null, 2));

const external = [...Object.keys(dependencies), 'k99', 'k99/node', 'k99/cli'];

const bYear = 2019;
const year = new Date().getFullYear();
const date = bYear === year ? bYear : `${ bYear }-${ year }`;
const banner = `\
/*!
 * k99 v${ version }
 * (c) ${ date } ${ author }
 * @license ${ license }
 */`;

const browserPackage = JSON.stringify({
	'main': './index.mjs',
	'type': 'module',
	'browser': './index.min.js',
	'unpkg': './index.min.js',
	'jsdelivr': './index.min.js',
}, null, 2);

const nodePackage = JSON.stringify({
	'main': './index.mjs',
	'type': 'module',
}, null, 2);


function plugins(b) {
	const plugins = [
		resolve({ extensions: [ '.ts' ]}),
		babel({
			extensions: ['.ts' ],
			plugins: [['@babel/plugin-transform-typescript']],
			babelHelpers: 'bundled',
		}),
		replace({preventAssignment: true, values: { __VERSION__: version }}),
	];
	if (b) { plugins.push(terser()); }
	return plugins;
}

function createBaseItem(id) {
	fsFn.mkdirSync(`build/${ id }`, {recursive: true});
	fsPromises.writeFile(`build/${ id }/package.json`, nodePackage);
	const input = `src/${ id }/index.ts`;
	return [{ input, external, plugins: plugins(), output: [
		{ banner, file: `build/${ id }/index.mjs`, format: 'esm' },
	]}, { input, external, plugins: [ dts() ], output: [
		{ format: 'esm', banner, file: `build/${ id }/index.d.ts` },
	] }];
}
function createBrowserItem(id, name = 'k99') {
	if (id) {
		fsFn.mkdirSync(`build/${ id }`, {recursive: true});
		fsPromises.writeFile(`build/${ id }/package.json`, browserPackage);
	}
	const input = `src/${ id || 'core' }/index.ts`;
	const output = `build/${ id ? `${ id }/` : '' }index`;
	return [ { input, external, plugins: plugins(), output: [
		{ format: 'esm', banner, file: `${ output }.mjs` },
		{ format: 'umd', banner, file: `${ output }.js`, exports: 'named', name },
	] }, { input, external, plugins: plugins(1), output: [
		{ format: 'esm', banner, file: `${ output }.min.mjs` },
		{ format: 'umd', banner, file: `${ output }.min.js`, exports: 'named', name },
	] }, { input, external, plugins: [ dts() ], output: [
		{ format: 'esm', banner, file: `${ output }.d.ts` },
	] } ];
}
export default [
	...createBrowserItem(),
	...createBrowserItem('browser', 'k99Browser'),
	...createBrowserItem('services', 'k99Services'),
	...createBaseItem('node'),
	...createBaseItem('cli'),
	{ input: 'src/cli/cli.ts', external, plugins: plugins(), output: [
		{ format: 'esm', banner: `#!/usr/bin/env node\n${ banner }`,  file: 'build/cli.mjs'  },
	] }, { input: 'src/starter.ts', external, plugins: plugins(), output: [
		{ format: 'esm', banner: `#!/usr/bin/env node\n${ banner }`,  file: 'build/starter.mjs' },
	] },
];
