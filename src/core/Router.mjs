/** @import { Context, FindHandler, Handler, Method } from './main/types' */
/** @import { Onionskin } from './onionskin.mjs' */
import packer from './packer.mjs';

/**
 * @callback Guard
 * @param {Context} ctx
 * @returns {PromiseLike<boolean | Handler | void> | boolean | Handler | void}
 */
/**
 * @typedef {[Handler | Router, Record<string | symbol, any>, string[]]} FindItem
 */
/**
 * @callback Finder
 * @this {Router}
 * @param {Method} method
 * @param {string[]} path
 * @param {Context} ctx 
 * @returns {AsyncIterable<FindItem> | Iterable<FindItem>}
 */

/**
 * 
 * @param {Set<Guard>} guards 
 * @param {Context} ctx 
 * @param {(v: any) => void} setParams 
 * @param {object} params 
 * @returns {Promise<boolean | Handler>}
 */
async function execGuard(guards, ctx, setParams, params) {
	if (!guards.size) { return true; }
	setParams(params);
	for (const guard of guards) {
		if (ctx.destroyed) { return false; }
		const ret = await guard(Object.create(ctx, {
			params: { value: { ...params } },
		}));
		if (ret === false) { return false; }
		// @ts-ignore
		if (typeof ret === 'function') { return ret; }
	}
	return true;
}

/**
 * 
 * @param {Router | Handler} route 
 * @param {string[]} path 
 * @param {Context} ctx 
 * @param {(v: any) => void} setParams 
 * @param {object} params 
 * @returns {Promise<Handler | null>}
 */
async function find(route, path, ctx, setParams, params) {
	if (!(route instanceof Router)) {
		setParams(params);
		return route;
	}
	if (route.disabled) { return null; }
	const guardResult = await execGuard(route.guards, ctx, setParams, params);
	if (!guardResult) { return null; }
	if (typeof guardResult === 'function') { return guardResult; }
	if (ctx.destroyed) { return null; }
	for await (const [r, result, p] of route.find(ctx.method, path, ctx)) {
		if (ctx.destroyed) { return null; }
		const res = await find(r, p, ctx, setParams, { ...params, ...result });
		if (res) { return route.__onionskin(res); }
	}
	return null;
}

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
	 * @abstract
	 * @param {Method} method 
	 * @param {string[]} path 
	 * @param {Context} ctx 
	 * @returns {AsyncIterable<FindItem> | Iterable<FindItem>}
	 */
	find(method, path, ctx) { return []; }
	/**
	 * 
	 * @param {Router[]} routers 
	 * @returns {FindHandler}
	 */
	static make(routers) {
		return async (ctx, setParams) => {
			const list = routers.flat();
			const path = ctx.url.pathname.split('/').filter(Boolean).map(uriDecode);
			for (const route of list) {
				const res = await find(route, path, ctx, setParams, {});
				if (res) { return res; }
			}
			return null;
		};
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
	/** @readonly @type {Set<Guard>} */
	guards = new Set();
	/**
	 * 
	 * @param {Handler} h 
	 * @returns {Handler}
	 */
	__onionskin = (h) => h;
	/** @param {Onionskin} os */
	onionskin(os) { this.__onionskin = packer(os, this.__onionskin); }
}
export default Router;
