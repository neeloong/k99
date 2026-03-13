/** @import { Method, Params } from './main/types' */

/**
 * @template {Function} T
 * @typedef {[T | T[] | Router<T>, Record<string | symbol, any>, string[]]} FindItem
 */
/**
 * @template {Function} T
 * @callback Finder
 * @this {Router<T>}
 * @param {Method} method
 * @param {string[]} path
 * @returns {AsyncIterable<FindItem<T>> | Iterable<FindItem<T>>}
 */

/**
 * @abstract
 * @template {Function} T
 */
class Router {
	disabled = false;
	/**
	 * 
	 * @template {Function} T
	 * @param {Router<T> | T[] | T} route 
	 * @param {Method} method 
	 * @param {string[]} path 
	 * @param {(() => boolean) | void | null} destroyed 
	 * @param {((v: Params) => void) | void | null} setParams 
	 * @param {Params} params 
	 * @returns {Promise<T[] | null>}
	 */
	static async #find(route, method, path, destroyed, setParams, params) {
		if (!(route instanceof Router)) {
			if (typeof setParams === 'function') { setParams(params); }
			// @ts-ignore
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
	 * @template {Function} T
	 * @param {Router<T>[]} routers 
	 * @param {Method} method 
	 * @param {string[]} path 
	 * @param {(() => boolean) | void | null} [destroyed] 
	 * @param {((v: Params) => void) | void | null} [setParams] 
	 * @returns {Promise<T[] | null>}
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
	 * @returns {AsyncIterable<FindItem<T>> | Iterable<FindItem<T>>}
	 */
	find(method, path) { return []; }


	/** @type {T[]} */
	#guards = [];
	/**
	 * 
	 * @param  {...T | T[]} guards 
	 */
	guard(...guards) {
		const list = this.#guards;
		for (const guard of guards.flat()) {
			if (typeof guard !== 'function') { continue; }
			// @ts-ignore
			list.push(guard);
		}
	}

	/**
	 * 
	 * @template {Function} T
	 * @param {Finder<T>} find 
	 * @returns {Router<T>}
	 */
	static create(find) {
		return Object.defineProperties(new Router(), {
			'find': { configurable: true, value: find, writable: true },
		});
	}
}
export default Router;
