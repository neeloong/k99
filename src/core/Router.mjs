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
	 * @param {Params} params 
	 * @param {AbortSignal?} [signal] 
	 * @param {((v: Params) => void)?} [setParams] 
	 * @returns {Promise<T[] | null>}
	 */
	static async #find(route, method, path, params, signal, setParams) {
		if (!(route instanceof Router)) {
			if (typeof setParams === 'function') { setParams(params); }
			// @ts-ignore
			return [route].flat();
		}
		if (route.disabled) { return null; }
		if (signal?.aborted) { return null; }
		for await (const [r, result, p] of route.find(method, path)) {
			if (signal?.aborted) { return null; }
			const res = await Router.#find(r, method, p, { ...params, ...result }, signal, setParams);
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
	 * @param {AbortSignal?} [signal] 
	 * @param {((v: Params) => void)?} [setParams] 
	 * @returns {Promise<T[] | null>}
	 */
	static async find(routers, method, path, signal, setParams) {
		const m = `${method}`.toUpperCase();
		for (const route of routers.flat()) {
			const res = await Router.#find(route, m, path, {}, signal, setParams);
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
