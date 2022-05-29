import * as fsPromise from 'node:fs/promises';
import * as pathFn from 'node:path';
import type { MaybePromise } from 'k99';
import { Plugin, Router } from 'k99';
import Scanner from './Scanner';

async function getRouters(
	router?: Router | (() => MaybePromise<Router>),
	routers?: (Router | (() => MaybePromise<Router>))[],
): Promise<Router[] | undefined> {
	const r = await getRouter(router);
	if (!Array.isArray(routers)) {
		return r ? [r] : undefined;
	}
	const list: Router[] = r ? [r] : [];
	for (const router of routers) {
		const r = await getRouter(router);
		if (r) { list.push(r); }
	}
	if (list.length) { return list; }
}

async function getRouter(
	router?: Router | (() => MaybePromise<Router>),
): Promise<Router | undefined> {
	if (typeof router === 'function') {
		router = await router();
	}
	if (router instanceof Router) { return router; }
}


class FsPlugin extends Plugin {
	/** 路径 */
	readonly path: string;

	async readSettings(path: string): Promise<any> {
		const p = pathFn.resolve(this.settingsPath, `${ path }.json`);
		try {
			const text = await fsPromise.readFile(p, 'utf-8');
			return JSON.parse(text);
		} catch {}
	}
	async readAsset(path: string): Promise<Uint8Array | null> {
		try {
			const buff = await fsPromise.readFile(
				pathFn.resolve(this.assetsPath, path),
			);
			return buff;
		} catch {
			return null;
		}
	}
	readonly assetsPath: string;
	readonly settingsPath: string;
	/** 日志路径，仅入口有效 */
	readonly logsPath: string;
	private readonly _config: FsPlugin.Config;
	constructor(config: FsPlugin.Config, name: string) {
		const {
			path,
			version,
			author,
			license,
			assetsPath,
			settingsPath,
			logsPath,
		} = config;
		super(name, version || '', {author, license});
		this._config = config;
		this.assetsPath = pathFn.resolve(path, assetsPath || 'assets');
		this.settingsPath = pathFn.resolve(path, settingsPath || 'settings');
		this.logsPath = pathFn.resolve(path, logsPath || 'logs');
		this.path = path;
	}

	protected async _initRouter(pluginRouter: Router) {
		const {_config} = this;
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

declare namespace FsPlugin {

	/** 插件配置 */
	export interface Config {
	/** assets 路径 */
		assetsPath?: string;
		/** 设置路径 */
		settingsPath?: string;
		/** 日志路径，仅入口有效 */
		logsPath?: string;

		/** 插件的实际路径 */
		path: string;
		/** 包名 */
		name?: string;
		/** 版本 */
		version?: string;
		/** 作者 */
		author?: string;
		/** 开源协议 */
		license?: string;

		appPath?: string

		/** 依赖项 */
		dependencies?: string[];
		/** 依赖的包所在的 npm 模块 */
		packages?: string[];
		/** 导入的子插件，仅入口有效 */
		plugins?: string[];
		/**
		 * 插件扫描列表，仅入口有效
		 * @default 'plugins'
		 */
		scan?: string;

		router?: Router | (() => MaybePromise<Router>);
		routers?: (Router | (() => MaybePromise<Router>))[];
	}

}
export default FsPlugin;
