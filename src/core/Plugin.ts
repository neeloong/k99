import make from './make';
import Router from './Router';
import type { Environment } from './createEnvironment';
import createEnvironment from './createEnvironment';
import type { Options } from './types/Options';

const idRegexText = '[a-zA-Z][a-zA-Z0-9_-]*';
const kRegexText = `${ idRegexText }(?:.${ idRegexText })*`;
const regexText = `^/(${ idRegexText })/((?:@${ kRegexText }/)?${ kRegexText })/(.+)$`;
const regex = new RegExp(regexText);

export default abstract class Plugin<T extends Router = Router> {
	static make(
		plugins: Record<string, Plugin>,
		{ router, setting, asset, log, environment, ...options}: {
			router?: Router;
			asset?: Environment.Asset.Api;
			setting?: Environment.Setting.Api;
			log?: Environment.Log.Api;
		} & Options = {},
	) {
		const routers = [];
		for (const plugin of Object.values(plugins)) {
			routers.push(plugin.router);
		}
		if (router instanceof Router) {
			routers.push(router);
		}
		return make(Router.make(routers), {
			...options,
			environment: {
				...environment,
				...createEnvironment({setting, asset: Plugin.bindAsset(asset, plugins), log}),
			},
		});

	}
	static bindAsset(
		api: Environment.Asset.Api, plugins?: Record<string, Plugin>, pluginPath?: string
	): Environment.Asset.Api;
	static bindAsset(
		api?: Environment.Asset.Api, plugins?: Record<string, Plugin>, pluginPath?: string
	): Environment.Asset.Api | undefined;
	static bindAsset(
		api?: Environment.Asset.Api, plugins?: Record<string, Plugin>, pluginPath = 'plugins'
	): Environment.Asset.Api | undefined {
		if (!plugins) { return api; }
		const read = api?.read;
		if (typeof read !== 'function') { return api; }
		return {
			...api, read: async path => {
				const ret = await read(path);
				if (ret !== null) { return ret; }
				if (!plugins) { return null; }
				const r = regex.exec(path);
				if (!r) { return null; }
				const [, base, name, subpath] = r;
				if (base !== pluginPath) { return null; }
				if (!(name in plugins)) { return null; }
				const plugin = plugins[name];
				if (!plugin) { return null; }
				return plugin.readAsset(subpath);
			},
		};
	}

	/** 包名 */
	readonly name: string;
	/** 版本 */
	readonly version: string;
	/** 作者 */
	readonly author: string;
	/** 开源协议 */
	readonly license: string;
	constructor(
		name: string,
		/** 版本 */
		version: string,
		{ author, license }: {
			/** 作者 */
			author?: string;
			/** 开源协议 */
			license?: string;
		} = {}
	) {
		this.name = name;
		this.version = typeof version === 'string' ? version : '';
		this.author = typeof author === 'string' ? author : '';
		this.license = typeof license === 'string' ? license : '';
	}

	abstract readSettings(path: string): any | Promise<any>;
	abstract readAsset(path: string): Promise<Uint8Array | null>;
	protected abstract _createRouter(): T;
	protected abstract _initRouter(router: T): Promise<void> | void;

	private __initRouterPromise: Promise<T> | undefined;
	initRouter() {
		const { router } = this;
		if (this.__initRouterPromise) {
			return this.__initRouterPromise;
		}
		return this.__initRouterPromise
			= Promise.resolve(this._initRouter(router))
				.then(() => router);
	}
	get router(): T {
		const router = this._createRouter();
		Reflect.defineProperty(this, 'router', {
			value: router,
			configurable: true,
		});
		this.initRouter();
		return router;
	}
	get disabled(): boolean {
		return this.router.disabled;
	}
	set disabled(t) {
		this.router.disabled = t;
	}
}
