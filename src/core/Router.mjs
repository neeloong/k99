
/**
 * @callback Guard
 * @param {import('./main/types').Context} ctx
 * @param {() => Promise<import('./main/types').HandlerResult>} [next]
 * @returns {PromiseLike<boolean | import('./main/types').Handler | import('./main/types').HandlerResult | void> | boolean | import('./main/types').HandlerResult | import('./main/types').Handler | void}
 */

/**
 * @typedef {[import('./main/types').Handler | Router, Record<string, any>, string[]]} FindItem
 */
/**
 * @callback Finder
 * @this {Router}
 * @param {import('./main/types').Method} method
 * @param {string[]} path
 * @param {import('./main/types').Context} ctx 
 * @returns {AsyncIterable<FindItem> | Iterable<FindItem>}
 */

/**
 * 
 * @param {Set<Guard>} guards 
 * @param {import('./main/types').Context} ctx 
 * @param {(v: any) => void} setParams 
 * @param {object} params 
 * @returns {Promise<boolean | import('./main/types').Handler>}
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
 * @param {Router | import('./main/types').Handler} route 
 * @param {string[]} path 
 * @param {import('./main/types').Context} ctx 
 * @param {(v: any) => void} setParams 
 * @param {object} params 
 * @returns {Promise<import('./main/types').Handler | null>}
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
		if (res) { return res; }
	}
	return null;
}
/**
 * 
 * @param {Router | import('./main/types').Handler} route 
 * @param {string[]} path 
 * @param {import('./main/types').Context} ctx 
 * @param {(v: any) => void} setParams 
 * @param {object} params 
 * @returns {Promise<import('./main/types').Handler | null>}
 */
async function findByOnion(route, path, ctx, setParams, params) {
	if (!(route instanceof Router)) {
		setParams(params);
		return route;
	}
	if (route.disabled) { return null; }
	for await (const [r, result, p] of route.find(ctx.method, path, ctx)) {
		if (ctx.destroyed) { return null; }
		const handler = await findByOnion(r, p, ctx, setParams, { ...params, ...result });
		if (!handler) { continue; }
		const guards = [...route.guards];
		/**
		 * 
		 * @param {import('./main/types').Context} ctx 
		 * @param {number} k 
		 * @returns 
		 */
		const run = async (ctx, k) => {
			const guard = guards[k];
			if (typeof guard !== 'function') { return handler(ctx); }
			const nextK = k + 1;
			const result = guard(ctx, () => run(ctx, nextK));
			if (typeof result === 'function') { return; }
			return result;
		};
		return ctx => run(ctx, 0);
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
	 * @param {import('./main/types').Method} method 
	 * @param {string[]} path 
	 * @param {import('./main/types').Context} ctx 
	 * @returns {AsyncIterable<FindItem> | Iterable<FindItem>}
	 */
	find(method, path, ctx) { return []; }
	/**
	 * 
	 * @param {Router[]} routers 
	 * @param {boolean} [onion]
	 * @returns {import('./main/types').FindHandler}
	 */
	static make(routers, onion) {
		const findFn = onion ? findByOnion : find;
		return async (ctx, setParams) => {
			const list = routers.flat();
			const path = ctx.url.pathname.split('/').filter(Boolean).map(uriDecode);
			for (const route of list) {
				const res = await findFn(route, path, ctx, setParams, {});
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
		return Object.create(Router.prototype, {
			'find': { configurable: true, value: find, writable: true },
		});
	}
	/** @readonly @type {Set<Guard>} */
	guards = new Set();
}
export default Router;
