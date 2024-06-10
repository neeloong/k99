import * as fsPromise from 'node:fs/promises';
import * as pathFn from 'node:path';
import { ApiRouter, Plugin, Router } from 'k99';
import createEnvironment from 'k99/environment';
import { Scanner } from './scanner/index.mjs';
import createFsAssetsApi from './createFsAssetsApi.mjs';
import createFsLogApi from './createFsLogApi.mjs';
import createFsSettingsApi from './createFsSettingsApi.mjs';

/**
 * 
 * @param {Router | (() => PromiseLike<Router> | Router)} [router] 
 * @param {(Router | (() => PromiseLike<Router> | Router))[]} [routers] 
 * @returns {Promise<Router[]?>}
 */
async function getRouters(router, routers) {
	const r = await getRouter(router);
	if (!Array.isArray(routers)) {
		return r ? [r] : null;
	}
	/** @type {Router[]} */
	const list = r ? [r] : [];
	for (const router of routers) {
		const r = await getRouter(router);
		if (r) { list.push(r); }
	}
	if (list.length) { return list; }
	return null;
}

/**
 * 
 * @param {Router | (() => PromiseLike<Router> | Router)} [router] 
 * @returns {Promise<Router | undefined>}
 */
async function getRouter(router) {
	if (typeof router === 'function') {
		router = await router();
	}
	if (router instanceof Router) { return router; }
}

// : {
// 	/** 工作路径 */
// 	path?: string;
// 	/** assets 路径 */
// 	assetPath?: string;
// 	/** 设置路径 */
// 	settingPath?: string;
// 	/** 日志路径 */
// 	logPath?: string;
// 	router?: Router;
// 	asset?: import('k99/environment').Asset.Api;
// 	setting?: import('k99/environment').Setting.Api;
// 	log?: import('k99/environment').Log.Api;
// } & import('k99').Options

/**
 * @extends {Plugin<ApiRouter>}
 */
class FsPlugin extends Plugin {
	/**
	 * 
	 * @param {Record<string, Plugin>} plugins 
	 * @param {{path?: string; assetPath?: string; settingPath?: string; logPath?: string; router?: Router; asset?: import('k99/environment').Asset.Api; setting?: import('k99/environment').Setting.Api; log?: import('k99/environment').Log.Api;} & import('k99').Options} options 
	 * @returns 
	 */
	static make(plugins, {
		path = process.cwd(),
		settingPath, assetPath, logPath,
		setting, asset, log, environment,
		...options
	} = {}) {
		const assetApi = asset || createFsAssetsApi(path, assetPath || 'assets');
		return super.make(plugins, {
			...options,
			environment: {
				...environment,
				...createEnvironment({
					asset: { ...assetApi, read: Plugin.bindAssetReader(plugins, assetApi.read) },
					setting: setting || createFsSettingsApi(path, settingPath || 'settings'),
					log: log || createFsLogApi(path, logPath || 'logs'),
				}),
			},
		});

	}
	/** @readonly @type {string} 路径 */
	path;

	/**
	 * 
	 * @param {string} path 
	 * @returns {Promise<any>}
	 */
	async readSettings(path) {
		const p = pathFn.resolve(this.settingsPath, `${ path }.json`);
		try {
			const text = await fsPromise.readFile(p, 'utf-8');
			return JSON.parse(text);
		} catch { }
	}
	/**
	 * 
	 * @param {string} path 
	 * @returns {Promise<Uint8Array?>}
	 */
	async readAsset(path) {
		try {
			const buff = await fsPromise.readFile(
				pathFn.resolve(this.assetsPath, path),
			);
			return buff;
		} catch {
			return null;
		}
	}
	/** @readonly @type {string} */
	assetsPath;
	/** @readonly @type {string} */
	settingsPath;
	/** @readonly @type {string} 日志路径，仅入口有效 */
	logsPath;
	/** @readonly @type {FsPluginConfig} */
	#config;
	/**
	 * 
	 * @param {FsPluginConfig} config 
	 * @param {string} name 
	 */
	constructor(config, name) {
		const {
			path,
			version,
			author,
			license,
			assetsPath,
			settingsPath,
			logsPath,
		} = config;
		super(name, version || '', { author, license });
		this.#config = config;
		this.assetsPath = pathFn.resolve(path, assetsPath || 'assets');
		this.settingsPath = pathFn.resolve(path, settingsPath || 'settings');
		this.logsPath = pathFn.resolve(path, logsPath || 'logs');
		this.path = path;
	}

	/** @protected */
	_createRouter() {
		return new ApiRouter();
	}
	/**
	 * 
	 * @protected
	 * @param {ApiRouter} pluginRouter
	 */
	async _initRouter(pluginRouter) {
		const _config = this.#config;
		const list = await getRouters(_config.router, _config.routers);
		for (const router of list || []) {
			pluginRouter.route(router);
		}
		const { appPath } = _config;
		if (list && !appPath) { return; }
		const { path } = _config;
		await Scanner.scan(
			pathFn.resolve(path, appPath || 'app'),
			pluginRouter,
		);
	}
}

export { FsPlugin };
/**
 * 插件配置
 * @typedef {object} FsPluginConfig
 * @property {string} [assetsPath] assets 路径
 * @property {string} [settingsPath] 设置路径
 * @property {string} [logsPath] 日志路径，仅入口有效
 * @property {string} path 插件的实际路径
 * @property {string} [name] 包名
 * @property {string} [version] 版本
 * @property {string} [author] 作者
 * @property {string} [license] 开源协议
 * @property {string} [appPath]
 * @property {string[]} [dependencies] 依赖项
 * @property {string[]} [packages] 依赖的包所在的 npm 模块
 * @property {string[]} [plugins] 导入的子插件，仅入口有效
 * @property {string} [scan='plugins'] 插件扫描列表，仅入口有效
 * @property {Router | (() => PromiseLike<Router> | Router)} [router]
 * @property {(Router | (() => PromiseLike<Router> | Router))[]} [routers]
 */
