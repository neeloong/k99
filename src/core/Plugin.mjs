import make from './make.mjs';
import Router from './Router.mjs';

const idRegexText = '[a-zA-Z][a-zA-Z0-9_-]*';
const kRegexText = `${ idRegexText }(?:.${ idRegexText })*`;
const regexText = `^/(${ idRegexText })/((?:@${ kRegexText }/)?${ kRegexText })/(.+)$`;
const regex = new RegExp(regexText);

/**
 * @abstract
 * @template {Router} [T=Router]
 */
export default class Plugin {
	/**
	 * 
	 * @param {Record<string, Plugin>} plugins 
	 * @param {{ router?: Router; } & import('./main/types').Options} [options] 
	 * @returns {(request: Request) => Promise<Response | null>}
	 */
	static make(plugins, { router, ...options } = {}) {
		const routers = [];
		for (const plugin of Object.values(plugins)) {
			routers.push(plugin.router);
		}
		if (router instanceof Router) {
			routers.push(router);
		}
		return make(Router.make(routers), options);
	}
	/**
	 * 
	 * @param {Record<string, Plugin>} plugins 
	 * @param {((path: string) => Promise<Uint8Array | null>)?} [read] 
	 * @param {string} [pluginPath] 
	 * @returns {(path: string) => Promise<Uint8Array | null>}
	 */
	static bindAssetReader(plugins, read, pluginPath = 'plugins'
	) {
		/** @type {(path: string) => Promise<Uint8Array | null>} */
		const readAsset = typeof read === 'function' ? read : async () => null;
		return async path => {
			const ret = await readAsset(path);
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
		};
	}

	/** @readonly @type {string} 包名 */
	name;
	/** @readonly @type {string} 版本 */
	version;
	/** @readonly @type {string} 作者 */
	author;
	/** @readonly @type {string} 开源协议 */
	license;
	/**
	 * 
	 * @param {string} name 
	 * @param {string} version 版本
	 * @param {object} [options] 
	 * @param {string} [options.author] 作者
	 * @param {string} [options.license] 开源协议
	 */
	constructor(name, version, { author, license } = {}) {
		this.name = name;
		this.version = typeof version === 'string' ? version : '';
		this.author = typeof author === 'string' ? author : '';
		this.license = typeof license === 'string' ? license : '';
	}

	/**
	 * @abstract
	 * @param {string} path 
	 * @returns {any | Promise<any>}
	 */
	readSettings(path) { return null; }
	/**
	 * @abstract
	 * @param {string} path 
	 * @returns {Promise<Uint8Array | null>}
	 */
	readAsset(path) { throw new Error(); }
	/**
	 * @protected
	 * @abstract
	 * @returns {T}
	 */
	_createRouter() { throw new Error(); }
	/**
	 * 
	 * @protected
	 * @abstract
	 * @param {T} router 
	 * @returns {Promise<void> | void}
	 */
	_initRouter(router) {}

	/** @type {Promise<T>?} */
	#initRouterPromise = null;
	initRouter() {
		const { router } = this;
		if (this.#initRouterPromise) {
			return this.#initRouterPromise;
		}
		return this.#initRouterPromise
			= Promise.resolve(this._initRouter(router))
				.then(() => router);
	}
	/** @type {T} */
	get router() {
		const router = this._createRouter();
		Reflect.defineProperty(this, 'router', {
			value: router,
			configurable: true,
		});
		this.initRouter();
		return router;
	}
	/** @type {boolean} */
	get disabled() {
		return this.router.disabled;
	}
	set disabled(t) {
		this.router.disabled = t;
	}
}
