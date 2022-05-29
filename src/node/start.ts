import * as fsPromise from 'node:fs/promises';
import * as pathFn from 'node:path';
import JSON5 from 'json5';
import yaml from 'yaml';
import FsPlugin from './FsPlugin';
import NodeApp from './NodeApp';

const idRegex = '[a-zA-Z][a-zA-Z0-9_-]*(?:.[a-zA-Z][a-zA-Z0-9_-]*)*';
const nsPluginRegex = new RegExp(`^(?:@${ idRegex }/)?${ idRegex }$`);
const pluginRegex = new RegExp(`^${ idRegex }$`);

function isNsPluginName(id?: string): id is string {
	if (!id) { return false; }
	if (typeof id !== 'string') { return false; }
	return pluginRegex.test(id) || nsPluginRegex.test(id);
}
function isPluginName(id?: string): id is string {
	if (!id) { return false; }
	if (typeof id !== 'string') { return false; }
	return pluginRegex.test(id);
}

const configFileNames = [
	'k99.config.mjs',
	'k99.config.js',
	'k99.config.yml',
	'k99.config.yaml',
	'k99.config.json',
	'k99.config.json5',
	'.k99.config.mjs',
	'.k99.config.js',
	'.k99.config.yml',
	'.k99.config.yaml',
	'.k99.config.json',
	'.k99.config.json5',
	'config/k99.mjs',
	'config/k99.js',
	'config/k99.yml',
	'config/k99.yaml',
	'config/k99.json',
	'config/k99.json5',
];
async function readConfigFile(file: string) {
	switch (pathFn.extname(file)) {
		case '.json':
		case '.json5':
			return fsPromise.readFile(file, 'utf-8').then(v => JSON5.parse(v));
		case '.yml':
		case '.yaml':
			return fsPromise.readFile(file, 'utf-8').then(v => yaml.parse(v, {}));
		default:
			return (await import(file)).default;
	}

}
/**
 * 读取配置
 */
async function readConfig(
	path: string,
): Promise<FsPlugin.Config | undefined> {
	for (let f of configFileNames) {
		const file = pathFn.resolve(path, f);
		if (!await fsPromise.stat(file).then(s => s.isFile()).catch(() => false)) { continue; }
		const config: FsPlugin.Config | undefined = await readConfigFile(file);
		if (config && typeof config === 'object') {
			return {...config, path};
		}
	}
	const file = pathFn.resolve(path, 'package.json');
	if (!await fsPromise.stat(file).then(s => s.isFile()).catch(() => false)) { return; }
	const pkg: any = await fsPromise.readFile(file, 'utf-8').then(v => JSON.parse(v));
	if (!pkg || typeof pkg !== 'object') { return; }
	const config = pkg.k99;
	if (!config || typeof config !== 'object') { return; }
	return {...config, path};
}

/**
 * 从 npm 包目录中查找
 * @param path    开始查找的路径
 * @param id      插件 id
 * @param plugins 已经加载过的插件
 */
async function find(
	path: string,
	id: string,
	plugins: Record<string, any>,
): Promise<FsPlugin.Config | undefined> {
	for (;;) {
		const modulePath = pathFn.resolve(path, 'node_modules');
		const pluginPath = pathFn.resolve(modulePath, id);
		const config = pluginPath in plugins && plugins[pluginPath] || await readConfig(pluginPath);
		if (config) { return config; }
		const p = pathFn.dirname(path);
		if (p === path) { return; }
		path = p;
	}

}

function getName(config: FsPlugin.Config): string {
	if (isPluginName(config.name)) {
		return config.name;
	}
	const name = pathFn.basename(config.path);
	if (isPluginName(name)) {
		return name;
	}
	return '';
}

async function findSubPackages(
	plugin: FsPlugin.Config,
	configs: Record<string, FsPlugin.Config>,
	plugins: Record<string, FsPlugin>,
) {
	if (plugin.packages) {
		for (let name of plugin.packages) {
			if (!isNsPluginName(name)) {
				// TODO: 抛出错误
				continue;
			}
			if (name in plugins) { continue; }
			const config = await find(plugin.path, name, configs);
			if (!config) {
				// TODO: 抛出错误
				continue;
			}
			plugins[name] = new FsPlugin(config, name);
			if (config.path in configs) { return; }
			configs[config.path] = config;
			findSubPackages(config, configs, plugins);
		}
	}
	for (const path of plugin.plugins || []) {
		const pluginPath = pathFn.resolve(plugin.path, path);
		const config = await readConfig(pluginPath);
		if (!config) {
			// TODO: 抛出错误
			continue;
		}
		const name = getName(config);
		if (!name) {
			// TODO: 抛出错误
			continue;
		}
		if (name in plugins) {
			// TODO: 抛出错误
			continue;
		}
		plugins[name] = new FsPlugin(config, name);
		configs[config.path] = config;
		findSubPackages(config, configs, plugins);
	}
}


export default async function start(): Promise<NodeApp> {
	const cwd = process.cwd();
	/** 入口模块 */
	const main: FsPlugin.Config = await readConfig(process.cwd()) || {
		scan: 'plugins',
		path: cwd,
	};
	const mainPlugin = new FsPlugin(main, '');

	/** 插件映射 */
	const configs: Record<string, FsPlugin.Config> = {};
	const plugins: Record<string, FsPlugin> = {};
	configs[cwd] = main;

	// 递归 npm 包插件
	findSubPackages(main, configs, plugins);

	if (main.scan) {
		const scanPath = pathFn.join(cwd, main.scan);
		for (let name of await fsPromise.readdir(scanPath,  'utf-8').catch(() =>[])) {
			if (!isPluginName(name)) { continue; }
			if (name in plugins) { continue; }
			const pluginPath = pathFn.resolve(cwd, name);
			const config = await readConfig(pluginPath);
			if (!config) { continue; }
			configs[config.path] = config;
			plugins[name] = new FsPlugin(config, name);
			await findSubPackages(config, configs, plugins);
		}
	}

	for (const plugin of Object.values(plugins)) {
		await plugin.initRouter();
	}

	await mainPlugin.initRouter();
	const app = new NodeApp(mainPlugin, plugins);

	return app;
}
