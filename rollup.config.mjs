import dts from 'rollup-plugin-dts';
import terser from '@rollup/plugin-terser';
import babel from '@rollup/plugin-babel';
import replace from '@rollup/plugin-replace';
import resolve from '@rollup/plugin-node-resolve';
import fsPromises from 'node:fs/promises';
const info = JSON.parse(await fsPromises.readFile('./package.json', 'utf-8'))
const {
	name, description, version, engines, dependencies, keywords,
	author, license, homepage, repository, bugs,
} = info;
await fsPromises.rm('build', { recursive: true }).catch(() =>{})
await fsPromises.mkdir('build', {recursive: true });
await fsPromises.writeFile('build/package.json', JSON.stringify({
	name, description, version, engines, dependencies, keywords,
	type: 'module', main: 'index.mjs',
	bin: {k99: 'cli.cjs', 'k99-start': 'starter.cjs'},
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

const external = [
	...Object.keys(dependencies),
	'k99',
	'k99/node',
	'node:http',
	'node:http2',
	'node:stream',
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
		resolve({ extensions: [ '.ts' ]}),
		babel({
			extensions: ['.ts' ],
			plugins: [['@babel/plugin-transform-typescript']],
			babelHelpers: 'bundled',
		}),
		replace({preventAssignment: true, values: { __VERSION__: version }}),
	];
	return plugins;
}

async function createBaseItem(id) {
	const input = `src/${ id }/index.ts`;
	return [{ input, external, plugins: plugins(), output: [
		{ banner, file: `build/${ id }/index.cjs`, format: 'cjs' },
	]}, { input, external, plugins: [ dts() ], output: [
		{ format: 'esm', banner, file: `build/${ id }/index.d.cts` },
	] }];
}
async function createBrowserItem(id, name = 'k99') {
	const input = `src/${ id || 'core' }/index.ts`;
	const output = `build/${ id ? `${ id.toLowerCase() }` : 'index' }`;
	return [ { input, external, plugins: plugins(), output: [
		{ format: 'cjs', banner, file: `${ output }.cjs` },
		{ format: 'esm', banner, file: `${ output }.mjs` },
		{ format: 'umd', banner, file: `${ output }.js`, name, globals },
		{ format: 'esm', banner, file: `${ output }.min.mjs`, plugins: [terser()] },
		{ format: 'umd', banner, file: `${ output }.min.js`, plugins: [terser()], name, globals },
	] }, { input, external, plugins: [ dts() ], output: [
		{ format: 'esm', banner, file: `${ output }.d.ts` },
	] } ];
}
export default [
	...await createBrowserItem(),
	...await createBrowserItem('services', 'k99Services'),
	...await createBaseItem('node'),
];
