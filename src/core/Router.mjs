
/**
 * @callback Guard
 * @param {import('./main/types').Context} ctx
 * @returns {PromiseLike<boolean | import('./main/types').Handler | void> | boolean | import('./main/types').Handler | void}
 */

/**
 * @callback Onionskin
 * @param {import('./main/types').Context} ctx
 * @param {() => Promise<import('./main/types').HandlerResult>} next
 * @returns {PromiseLike<import('./main/types').HandlerResult> | import('./main/types').HandlerResult}
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
	 * @param {import('./main/types').Method} method 
	 * @param {string[]} path 
	 * @param {import('./main/types').Context} ctx 
	 * @returns {AsyncIterable<FindItem> | Iterable<FindItem>}
	 */
	find(method, path, ctx) { return []; }
	/**
	 * 
	 * @param {Router[]} routers 
	 * @returns {import('./main/types').FindHandler}
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
		return Object.create(Router.prototype, {
			'find': { configurable: true, value: find, writable: true },
		});
	}
	/** @readonly @type {Set<Guard>} */
	guards = new Set();
	/**
	 * 
	 * @param {import('./main/types').Handler} h 
	 * @returns {import('./main/types').Handler}
	 */
	__onionskin = (h) => h;
	/** @param {Onionskin} os */
	onionskin(os) {
		let run = this.__onionskin;
		this.__onionskin = h => {
			const h2 = run(h)
			return async (ctx) => os(ctx, async () => h2(ctx));
		};
	}
}
export default Router;
