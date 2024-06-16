import Router from '../Router.mjs';
import toMatch from './toMatch.mjs';

import verb from './verb.mjs';
import getMethods from './getMethods.mjs';

/**
 * @callback Match
 * @param {string[]} paths
 * @returns {[Record<string, string | string[]>, string[]] | undefined}
 */

/**
 * @callback Binder
 * @param {import('../main/types').Handler} handler
 * @returns {() => void}
 */

/**
 * @typedef {object} Route
 * @property {Match} [match] 路径匹配
 * @property {null} [router]
 * @property {string} [plugin] 所属插件
 * @property {import('../main/types').Handler} handler 处理函数
 * @property {Set<import('../main/types').Method>} methods 方法列表
 */

/**
 * @typedef {object} RouterRoute
 * @property {Match} [match] 路径匹配
 * @property {Router} router
 */


/**
 * @template {Router | import('../Router.mjs').Finder} [T=ApiRouter]
 * @callback RouteBinder
 * @param {T} [router] 要注册的子路由或子路由的 Finder
 * @returns {T extends import('../Router.mjs').Finder ? Router : T}
 */
/**
 * 
 * @param {(Route | RouterRoute)[]} routes 
 * @param {string} path 
 * @param {Router | import('../Router.mjs').Finder} [r] 
 * @returns {Router}
 */
function bindRouter(routes, path, r) {
	const router = r instanceof Router ? r
		: typeof r === 'function' ? Router.create(r)
			: new ApiRouter();
	routes.push({ match: toMatch(path, false), router });
	return router;
}
export default class ApiRouter extends Router {
	/** @readonly @type {(Route | RouterRoute)[]} 路由列表 */
	#routes = [];
	/**
	 * 添加子路由
	 * @template {Router | import('../Router.mjs').Finder} [T=ApiRouter]
	 * @overload
	 * @param {T} [router] 要注册的子路由或子路由的 Finder
	 * @returns {T extends import('../Router.mjs').Finder ? Router : T}
	 */
	/**
	 * 添加子路由
	 * @template {Router | import('../Router.mjs').Finder} [T=ApiRouter]
	 * @overload
	 * @param {string} path   要注册的路径
	 * @param {T} [router] 要注册的子路由或子路由的 Finder
	 * @returns {T extends import('../Router.mjs').Finder ? Router : T}
	 */
	/**
	 * 添加子路由
	 * @overload
	 * @param {...TemplateStringsArray} path 要注册的路径
	 * @returns {RouteBinder}
	 */
	/**
	 * 添加子路由
	 * @param {...any} p 要注册的路径
	 * @returns {Router | RouteBinder}
	 */
	route(...p) {
		const [a] = p;
		if (a && typeof a === 'object' && !(a instanceof Router)) {
			const path = String.raw(a, ...p.slice(1));
			/**
			 * @param { import('../Router.mjs').Finder | Router} [r];
			 * @returns {any}
			 */
			return r => bindRouter(this.#routes, path, r);
		}
		const path = typeof a === 'string' ? a : '';
		const r = typeof a === 'string' ? p[1] : a;
		return bindRouter(this.#routes, path, r);
	}
	/**
	 * 
	 * @param {import('../main/types').Method} method 
	 * @param {string[]} path 
	 * @returns {Iterable<import('../Router.mjs').FindItem>}
	 */
	*find(method, path) {
		for (const route of Array.from(this.#routes)) {
			if (!route.router && !route.methods.has(method)) { continue; }
			const {match} = route;
			if (!match) {
				if (route.router || !path.length) {
					yield [route.router || route.handler, {}, path];
				}
				continue;
			}
			if (!path.length) { continue; }
			const result = match(path);
			if (!result) { continue; }
			yield [route.router || route.handler, ...result];
		}
	}
	/**
	 * 注册处理函数
	 * @overload
	 * @param {import('../main/types').Method | Iterable<import('../main/types').Method> | ArrayLike<import('../main/types').Method>} method  要注册的方法
	 * @param {import('../main/types').Handler} handler 要注册的处理函数
	 * @returns {() => void}
	 */
	/**
	 * 注册处理函数
	 * @overload
	 * @param {import('../main/types').Method | Iterable<import('../main/types').Method> | ArrayLike<import('../main/types').Method>} method  要注册的方法
	 * @param {string} path 要注册的路径
	 * @param {import('../main/types').Handler} handler 要注册的处理函数
	 * @returns {() => void}
	 */
	/**
	 * 注册处理函数
	 * @overload
	 * @param {import('../main/types').Method | Iterable<import('../main/types').Method> | ArrayLike<import('../main/types').Method>} method  要注册的方法
	 * @param {string} path   要注册的路径
	 * @returns {Binder}
	 */
	/**
	 * @param {import('../main/types').Method | Iterable<import('../main/types').Method> | ArrayLike<import('../main/types').Method>} methods 
	 * @param {string| import('../main/types').Handler} [path]
	 * @param {import('../main/types').Handler} [handler]
	 * @returns {Binder | (() => void)}
	 */
	verb(methods, path, handler) {
		const allMethods = getMethods(methods);
		if (!allMethods.length) { return () => {}; }
		return verb(this.#routes, allMethods, [path, handler]);
	}
	/**
	 * 注册 HTTP GET/POST/PUT/DELETE 处理函数
	 * @overload
	 * @param {import('../main/types').Handler} handler 要注册的处理函数
	 * @returns {() => void}
	 */
	/**
	 * 注册处理函数
	 * @overload
	 * @param {string} path 要注册的路径
	 * @param {import('../main/types').Handler} handler 要注册的处理函数
	 * @returns {() => void}
	 */
	/**
	 * 注册 HTTP GET/POST/PUT/DELETE 处理函数
	 * @overload
	 * @param {string} path 要注册的路径
	 * @returns {Binder}
	 */
	/**
	 * 注册 HTTP GET/POST/PUT/DELETE 处理函数
	 * @overload
	 * @param {...TemplateStringsArray} path 要注册的路径
	 * @returns {Binder}
	 */
	/**
	 * @param {...any} p 要注册的路径
	 * @returns {Binder | (() => void)}
	 */
	match(...p) {
		return verb(this.#routes, ['GET', 'POST', 'PUT', 'DELETE'], p);
	}
	/**
	 * 注册 HTTP GET 处理函数
	 * @overload
	 * @param {import('../main/types').Handler} handler 要注册的处理函数
	 * @returns {() => void}
	 */
	/**
	 * 注册 HTTP GET 处理函数
	 * @overload
	 * @param {string} path 要注册的路径
	 * @param {import('../main/types').Handler} handler 要注册的处理函数
	 * @returns {() => void}
	 */
	/**
	 * 注册 HTTP GET 处理函数
	 * @overload
	 * @param {string} path 要注册的路径
	 * @returns {Binder}
	 */
	/**
	 * 注册 HTTP GET 处理函数
	 * @overload
	 * @param {...TemplateStringsArray} path 要注册的路径
	 * @returns {Binder}
	 */
	/**
	 * @param {...any} p 要注册的路径
	 * @returns {Binder | (() => void)}
	 */
	get(...p) { return verb(this.#routes, ['GET'], p); }
	/**
	 * 注册 HTTP POST 处理函数
	 * @overload
	 * @param {import('../main/types').Handler} handler 要注册的处理函数
	 * @returns {() => void}
	 */
	/**
	 * 注册 HTTP POST 处理函数
	 * @overload
	 * @param {string} path 要注册的路径
	 * @param {import('../main/types').Handler} handler 要注册的处理函数
	 * @returns {() => void}
	 */
	/**
	 * 注册 HTTP POST 处理函数
	 * @overload
	 * @param {string} path 要注册的路径
	 * @returns {Binder}
	 */
	/**
	 * 注册 HTTP POST 处理函数
	 * @overload
	 * @param {...TemplateStringsArray} path 要注册的路径
	 * @returns {Binder}
	 */
	/**
	 * @param {...any} p 要注册的路径
	 * @returns {Binder | (() => void)}
	 */
	post(...p) { return verb(this.#routes, ['POST'], p); }
	/**
	 * 注册 HTTP PUT 处理函数
	 * @overload
	 * @param {import('../main/types').Handler} handler 要注册的处理函数
	 * @returns {() => void}
	 */
	/**
	 * 注册 HTTP PUT 处理函数
	 * @overload
	 * @param {string} path 要注册的路径
	 * @param {import('../main/types').Handler} handler 要注册的处理函数
	 * @returns {() => void}
	 */
	/**
	 * 注册 HTTP PUT 处理函数
	 * @overload
	 * @param {string} path 要注册的路径
	 * @returns {Binder}
	 */
	/**
	 * 注册 HTTP PUT 处理函数
	 * @overload
	 * @param {...TemplateStringsArray} path 要注册的路径
	 * @returns {Binder}
	 */
	/**
	 * @param {...any} p 要注册的路径
	 * @returns {Binder | (() => void)}
	 */
	put(...p) { return verb(this.#routes, ['PUT'], p); }
	/**
	 * 注册 HTTP DELETE 处理函数
	 * @overload
	 * @param {import('../main/types').Handler} handler 要注册的处理函数
	 * @returns {() => void}
	 */
	/**
	 * 注册 HTTP DELETE 处理函数
	 * @overload
	 * @param {string} path 要注册的路径
	 * @param {import('../main/types').Handler} handler 要注册的处理函数
	 * @returns {() => void}
	 */
	/**
	 * 注册 HTTP DELETE 处理函数
	 * @overload
	 * @param {string} path 要注册的路径
	 * @returns {Binder}
	 */
	/**
	 * 注册 HTTP DELETE 处理函数
	 * @overload
	 * @param {...TemplateStringsArray} path 要注册的路径
	 * @returns {Binder}
	 */
	/**
	 * @param {...any} p 要注册的路径
	 * @returns {Binder | (() => void)}
	 */
	delete(...p) { return verb(this.#routes, ['DELETE'], p); }
	/**
	 * 注册 HTTP HEAD 处理函数
	 * @overload
	 * @param {import('../main/types').Handler} handler 要注册的处理函数
	 * @returns {() => void}
	 */
	/**
	 * 注册 HTTP HEAD 处理函数
	 * @overload
	 * @param {string} path 要注册的路径
	 * @param {import('../main/types').Handler} handler 要注册的处理函数
	 * @returns {() => void}
	 */
	/**
	 * 注册 HTTP HEAD 处理函数
	 * @overload
	 * @param {string} path 要注册的路径
	 * @returns {Binder}
	 */
	/**
	 * 注册 HTTP HEAD 处理函数
	 * @overload
	 * @param {...TemplateStringsArray} path 要注册的路径
	 * @returns {Binder}
	 */
	/**
	 * @param {...any} p 要注册的路径
	 * @returns {Binder | (() => void)}
	 */
	head(...p) { return verb(this.#routes, ['HEAD'], p); }
	/**
	 * 注册 HTTP OPTIONS 处理函数
	 * @overload
	 * @param {import('../main/types').Handler} handler 要注册的处理函数
	 * @returns {() => void}
	 */
	/**
	 * 注册 HTTP OPTIONS 处理函数
	 * @overload
	 * @param {string} path 要注册的路径
	 * @param {import('../main/types').Handler} handler 要注册的处理函数
	 * @returns {() => void}
	 */
	/**
	 * 注册 HTTP OPTIONS 处理函数
	 * @overload
	 * @param {string} path 要注册的路径
	 * @returns {Binder}
	 */
	/**
	 * 注册 HTTP OPTIONS 处理函数
	 * @overload
	 * @param {...TemplateStringsArray} path 要注册的路径
	 * @returns {Binder}
	 */
	/**
	 * @param {...any} p 要注册的路径
	 * @returns {Binder | (() => void)}
	 */
	options(...p) { return verb(this.#routes, ['OPTIONS'], p); }
}
