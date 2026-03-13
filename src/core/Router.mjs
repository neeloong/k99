/** @import { Context, FindHandler, Handler, Method, Params } from './main/types' */

/**
 * @callback Guard
 * @param {Context} ctx
 * @returns {PromiseLike<boolean | Handler | void> | boolean | Handler | void}
 */
/**
 * @typedef {[Handler | Handler[] | Router, Record<string | symbol, any>, string[]]} FindItem
 */
/**
 * @callback Finder
 * @this {Router}
 * @param {Method} method
 * @param {string[]} path
 * @returns {AsyncIterable<FindItem> | Iterable<FindItem>}
 */


/**
 * 
 * @param {string} t 
 * @returns 
 */
function uriDecode(t) {
	try {
		return decodeURIComponent(t);
	} catch {
		return t;
	}
}
/**
 * @abstract
 */
class Router {
	disabled = false;
	/**
	 * 
	 * @param {Router | Handler[] | Handler} route 
	 * @param {Method} method 
	 * @param {string[]} path 
	 * @param {(() => boolean) | void | null} destroyed 
	 * @param {((v: Params) => void) | void | null} setParams 
	 * @param {Params} params 
	 * @returns {Promise<Handler[] | null>}
	 */
	static async #find(route, method, path, destroyed, setParams, params) {
		if (!(route instanceof Router)) {
			if (typeof setParams === 'function') { setParams(params); }
			return [route].flat();
		}
		if (route.disabled) { return null; }
		if (destroyed?.()) { return null; }
		for await (const [r, result, p] of route.find(method, path)) {
			if (destroyed?.()) { return null; }
			const res = await Router.#find(r, method, p, destroyed, setParams, { ...params, ...result });
			if (res) { return [...route.#guards, ...res]; }
		}
		return null;
	}
	/**
	 * 
	 * @param {Router[]} routers 
	 * @param {Method} method 
	 * @param {string[]} path 
	 * @param {(() => boolean) | void | null} [destroyed] 
	 * @param {((v: Params) => void) | void | null} [setParams] 
	 * @returns {Promise<Handler[] | null>}
	 */
	static async find(routers, method, path, destroyed, setParams) {
		for (const route of routers.flat()) {
			const res = await Router.#find(route, method, path, destroyed, setParams, {});
			if (res) { return res; }
		}
		return null;
	}
	/**
	 * @abstract
	 * @param {Method} method 
	 * @param {string[]} path 
	 * @returns {AsyncIterable<FindItem> | Iterable<FindItem>}
	 */
	find(method, path) { return []; }
	/**
	 * 
	 * @param {Router[]} routers 
	 * @returns {FindHandler}
	 */
	static make(routers) {
		return async (ctx, setParams) => {
		const path = ctx.url.pathname.split('/').filter(Boolean).map(uriDecode);
			return Router.find(routers, ctx.method, path, () => ctx.destroyed, setParams);
		};
	}


	/** @type {Handler[]} */
	#guards = [];
	/**
	 * 
	 * @param  {...Handler | Handler[]} guards 
	 */
	guard(...guards) {
		const list =this.#guards;
		for (const guard of guards.flat()) {
			if (typeof guard !== 'function') { continue; }
			list.push(guard)
		}
	}

	/**
	 * 
	 * @param {Finder} find 
	 * @returns {Router}
	 */
	static create(find) {
		return Object.defineProperties(new Router(), {
			'find': { configurable: true, value: find, writable: true },
		});
	}
}
export default Router;
