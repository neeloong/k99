/** @import { Context, Handler, Method, Params } from '../main/types' */
/** @import { Finder, FindItem } from '../Router.mjs' */
import Router from '../Router.mjs';
import toMatch from './toMatch.mjs';

import verb from './verb.mjs';
import getMethods from './getMethods.mjs';

/**
 * @callback Match
 * @param {string[]} paths
 * @returns {[Params, string[]] | undefined}
 */

/** @typedef {(handler: Handler, ...handlers: Handler[]) => () => void} Binder */

/**
 * @typedef {object} Route
 * @property {Match} [match] 路径匹配
 * @property {null} [router]
 * @property {string} [plugin] 所属插件
 * @property {Handler[]} handlers 处理函数
 * @property {Set<Method>} methods 方法列表
 */

/**
 * @typedef {object} RouterRoute
 * @property {Match} [match] 路径匹配
 * @property {Router} router
 */


/**
 * @template {Router | Finder} [T=ApiRouter]
 * @callback RouteBinder
 * @param {T} [router] 要注册的子路由或子路由的 Finder
 * @returns {T extends Finder ? Router : T}
 */
/**
 *
 * @param {(Route | RouterRoute)[]} routes
 * @param {string | [string[], any[]]} path
 * @param {Router | Finder} [r]
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
	 * @template {Router | Finder} [T=ApiRouter]
	 * @overload
	 * @param {T} [router] 要注册的子路由或子路由的 Finder
	 * @returns {T extends Finder ? Router : T}
	 */
	/**
	 * 添加子路由
	 * @template {Router | Finder} [T=ApiRouter]
	 * @overload
	 * @param {string} path   要注册的路径
	 * @param {T} [router] 要注册的子路由或子路由的 Finder
	 * @returns {T extends Finder ? Router : T}
	 */
	/**
	 * 添加子路由
	 * @overload
	 * @param {TemplateStringsArray} template 要注册的路径模板
	 * @param {...any} substitutions 要注册的路径模板代替内容
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
			/**
			 * @param { Finder | Router} [r];
			 * @returns {any}
			 */
			return r => bindRouter(this.#routes, [a, p.slice(1)], r);
		}
		const path = typeof a === 'string' ? a : '';
		const r = typeof a === 'string' ? p[1] : a;
		return bindRouter(this.#routes, path, r);
	}
	/**
	 *
	 * @param {Method} method
	 * @param {string[]} path
	 * @param {Context} ctx
	 * @returns {Iterable<FindItem>}
	 */
	*find(method, path, ctx) {
		for (const route of Array.from(this.#routes)) {
			if (!route.router && !route.methods.has(method)) { continue; }
			const {match} = route;
			if (!match) {
				if (route.router || !path.length) {
					yield [route.router || route.handlers, {}, path];
				}
				continue;
			}
			if (!path.length) { continue; }
			const result = match(path);
			if (!result) { continue; }
			yield [route.router || route.handlers, ...result];
		}
	}
	/**
	 * 注册处理函数
	 * @overload
	 * @param {Method | Iterable<Method> | ArrayLike<Method>} method  要注册的方法
	 * @param {Handler} handler 要注册的处理函数
	 * @returns {() => void}
	 */
	/**
	 * 注册处理函数
	 * @overload
	 * @param {Method | Iterable<Method> | ArrayLike<Method>} method  要注册的方法
	 * @param {string} path 要注册的路径
	 * @param {Handler} handler 要注册的处理函数
	 * @returns {() => void}
	 */
	/**
	 * 注册处理函数
	 * @overload
	 * @param {Method | Iterable<Method> | ArrayLike<Method>} method  要注册的方法
	 * @param {string} path   要注册的路径
	 * @returns {Binder}
	 */
	/**
	 * @param {Method | Iterable<Method> | ArrayLike<Method>} methods
	 * @param {string| Handler} [path]
	 * @param {...Handler} handler
	 * @returns {Binder | (() => void)}
	 */
	verb(methods, path, ...handler) {
		const allMethods = getMethods(methods);
		if (!allMethods.length) { return () => {}; }
		return verb(this.#routes, allMethods, [path, ...handler]);
	}
	/**
	 * 注册 HTTP GET/POST/PUT/DELETE 处理函数
	 * @overload
	 * @param {...Handler} handlers 要注册的处理函数
	 * @returns {() => void}
	 */
	/**
	 * 注册处理函数
	 * @overload
	 * @param {string} path 要注册的路径
	 * @param {...Handler} handlers 要注册的处理函数
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
	 * @param {TemplateStringsArray} template 要注册的路径模板
	 * @param {...any} substitutions 要注册的路径模板代替内容
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
	 * @param {...Handler} handlers 要注册的处理函数
	 * @returns {() => void}
	 */
	/**
	 * 注册 HTTP GET 处理函数
	 * @overload
	 * @param {string} path 要注册的路径
	 * @param {...Handler} handlers 要注册的处理函数
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
	 * @param {TemplateStringsArray} template 要注册的路径模板
	 * @param {...any} substitutions 要注册的路径模板代替内容
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
	 * @param {...Handler} handlers 要注册的处理函数
	 * @returns {() => void}
	 */
	/**
	 * 注册 HTTP POST 处理函数
	 * @overload
	 * @param {string} path 要注册的路径
	 * @param {...Handler} handlers 要注册的处理函数
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
	 * @param {TemplateStringsArray} template 要注册的路径模板
	 * @param {...any} substitutions 要注册的路径模板代替内容
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
	 * @param {...Handler} handlers 要注册的处理函数
	 * @returns {() => void}
	 */
	/**
	 * 注册 HTTP PUT 处理函数
	 * @overload
	 * @param {string} path 要注册的路径
	 * @param {...Handler} handlers 要注册的处理函数
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
	 * @param {TemplateStringsArray} template 要注册的路径模板
	 * @param {...any} substitutions 要注册的路径模板代替内容
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
	 * @param {...Handler} handlers 要注册的处理函数
	 * @returns {() => void}
	 */
	/**
	 * 注册 HTTP DELETE 处理函数
	 * @overload
	 * @param {string} path 要注册的路径
	 * @param {...Handler} handlers 要注册的处理函数
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
	 * @param {TemplateStringsArray} template 要注册的路径模板
	 * @param {...any} substitutions 要注册的路径模板代替内容
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
	 * @param {...Handler} handlers 要注册的处理函数
	 * @returns {() => void}
	 */
	/**
	 * 注册 HTTP HEAD 处理函数
	 * @overload
	 * @param {string} path 要注册的路径
	 * @param {...Handler} handlers 要注册的处理函数
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
	 * @param {TemplateStringsArray} template 要注册的路径模板
	 * @param {...any} substitutions 要注册的路径模板代替内容
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
	 * @param {...Handler} handlers 要注册的处理函数
	 * @returns {() => void}
	 */
	/**
	 * 注册 HTTP OPTIONS 处理函数
	 * @overload
	 * @param {string} path 要注册的路径
	 * @param {...Handler} handlers 要注册的处理函数
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
	 * @param {TemplateStringsArray} template 要注册的路径模板
	 * @param {...any} substitutions 要注册的路径模板代替内容
	 * @returns {Binder}
	 */
	/**
	 * @param {...any} p 要注册的路径
	 * @returns {Binder | (() => void)}
	 */
	options(...p) { return verb(this.#routes, ['OPTIONS'], p); }
}
