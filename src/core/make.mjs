import main from './main/index.mjs';
import Router from './Router.mjs';
/** @import { FindHandler, Handler, Options } from './main/types' */

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
 *
 * @param {Router<Handler> | Router<Handler>[] | FindHandler} routers
 * @param {Options} options
 * @returns {(request: Request) => Promise<Response | null>}
 */
export default function make(routers, options) {
	if (typeof routers === 'function') {
		return r => main(r, routers, options);
	}
	const list = [routers].flat();
	/** @type {FindHandler} */
	const getHandler = (ctx, setParams) => {
		const path = ctx.url.pathname.split('/').filter(Boolean).map(uriDecode);
		return Router.find(list, ctx.method, path, () => ctx.destroyed, setParams);
	};
	return r => main(r, getHandler, options);
}
