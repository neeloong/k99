/** @import { Handler, Method, Params } from '../main/types' */
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

/**
 * @template {Function} T
 * @typedef {(handler: T, ...handlers: T[]) => () => void} Binder
 */


/**
 * @template {Function} T
 * @callback Verb1
 * @param {T} handler 要注册的处理函数
 * @param {...T} handlers 要注册的处理函数
 * @returns {() => void}
 */
/**
 * @template {Function} T
 * @callback Verb2
 * @param {string} path 要注册的路径
 * @param {T} handler 要注册的处理函数
 * @param {...T} handlers 要注册的处理函数
 * @returns {() => void}
 */
/**
 * @template {Function} T
 * @callback Verb3
 * @param {string} path 要注册的路径
 * @returns {Binder<T>}
 */
/**
 * @template {Function} T
 * @callback Verb4
 * @param {TemplateStringsArray} template 要注册的路径模板
 * @param {...any} substitutions 要注册的路径模板代替内容
 * @returns {Binder<T>}
 */
/**
 * @template {Function} T
 * @typedef {Verb1<T> & Verb2<T> & Verb3<T> & Verb4<T>} Verb
 */

/**
 * @template {Function} T
 * @typedef {object} Route
 * @property {Match} [match] 路径匹配
 * @property {null} [router]
 * @property {T[]} handlers 处理函数
 * @property {Set<Method>} methods 方法列表
 */

/**
 * @template {Function} T
 * @typedef {object} RouterRoute
 * @property {Match} [match] 路径匹配
 * @property {Router<T>} router
 */


/**
 * @template {Function} T
 * @template {Router<T> | Finder<T>} [P=ApiRouter<T>]
 * @callback RouteBinder
 * @param {P} [router] 要注册的子路由或子路由的 Finder<T>
 * @returns {P extends Finder<T> ? Router<T> : P}
 */
/**
 *
 * @template {Function} T
 * @param {(Route<T> | RouterRoute<T>)[]} routes
 * @param {string | [string[], any[]]} path
 * @param {Router<T> | Finder<T>} [r]
 * @returns {Router<T>}
 */
function bindRouter(routes, path, r) {
	/** @type {Router<T>} */
	const router = r instanceof Router ? r
		: typeof r === 'function' ? Router.create(r)
			: new ApiRouter();
	routes.push({ match: toMatch(path, false), router });
	return router;
}
/**
 * 
 * @template {Function} T
 * @extends {Router<T>}
 */
export default class ApiRouter extends Router {
	/** @readonly @type {(Route<T> | RouterRoute<T>)[]} 路由列表 */
	#routes = [];
	/**
	 * 添加子路由
	 * @template {Router<T> | Finder<T>} [P=ApiRouter<T>]
	 * @overload
	 * @param {P} [router] 要注册的子路由或子路由的 Finder<T>
	 * @returns {P extends Finder<T> ? Router<T> : P}
	 */
	/**
	 * 添加子路由
	 * @template {Router<T> | Finder<T>} [P=ApiRouter<T>]
	 * @overload
	 * @param {string} path   要注册的路径
	 * @param {P} [router] 要注册的子路由或子路由的 Finder<T>
	 * @returns {P extends Finder<T> ? Router<T> : P}
	 */
	/**
	 * 添加子路由
	 * @overload
	 * @param {TemplateStringsArray} template 要注册的路径模板
	 * @param {...any} substitutions 要注册的路径模板代替内容
	 * @returns {RouteBinder<T>}
	 */
	/**
	 * 添加子路由
	 * @param {...any} p 要注册的路径
	 * @returns {Router<T> | RouteBinder<T>}
	 */
	route(...p) {
		const [a] = p;
		if (a && typeof a === 'object' && !(a instanceof Router)) {
			/**
			 * @param { Finder<T> | Router<T>} [r];
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
	 * @returns {Iterable<FindItem<T>>}
	 */
	*find(method, path) {
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
	 * @param {T} handler 要注册的处理函数
	 * @returns {() => void}
	 */
	/**
	 * 注册处理函数
	 * @overload
	 * @param {Method | Iterable<Method> | ArrayLike<Method>} method  要注册的方法
	 * @param {string} path 要注册的路径
	 * @param {T} handler 要注册的处理函数
	 * @returns {() => void}
	 */
	/**
	 * 注册处理函数
	 * @overload
	 * @param {Method | Iterable<Method> | ArrayLike<Method>} method  要注册的方法
	 * @param {string} path   要注册的路径
	 * @returns {Binder<T>}
	 */
	/**
	 * @param {Method | Iterable<Method> | ArrayLike<Method>} methods
	 * @param {string| T} [path]
	 * @param {...T} handler
	 * @returns {Binder<T> | (() => void)}
	 */
	verb(methods, path, ...handler) {
		const allMethods = getMethods(methods);
		if (!allMethods.length) { return () => {}; }
		return verb(this.#routes, allMethods, [path, ...handler]);
	}

	/**
	 * @param {Method | Iterable<Method> | ArrayLike<Method>} method  要注册的方法
	 * @returns {Verb<T>}
	 */
	method(method) {
		const methods = getMethods(method);
		// @ts-ignore
		return (...p) => verb(this.#routes, methods, p);
	}
	/**
	 * 注册 HTTP GET/POST/PUT/DELETE 处理函数
	 * @overload
	 * @param {...T} handlers 要注册的处理函数
	 * @returns {() => void}
	 */
	/**
	 * 注册处理函数
	 * @overload
	 * @param {string} path 要注册的路径
	 * @param {...T} handlers 要注册的处理函数
	 * @returns {() => void}
	 */
	/**
	 * 注册 HTTP GET/POST/PUT/DELETE 处理函数
	 * @overload
	 * @param {string} path 要注册的路径
	 * @returns {Binder<T>}
	 */
	/**
	 * 注册 HTTP GET/POST/PUT/DELETE 处理函数
	 * @overload
	 * @param {TemplateStringsArray} template 要注册的路径模板
	 * @param {...any} substitutions 要注册的路径模板代替内容
	 * @returns {Binder<T>}
	 */
	/**
	 * @param {...any} p 要注册的路径
	 * @returns {Binder<T> | (() => void)}
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
	 * @returns {Binder<T>}
	 */
	/**
	 * 注册 HTTP GET 处理函数
	 * @overload
	 * @param {TemplateStringsArray} template 要注册的路径模板
	 * @param {...any} substitutions 要注册的路径模板代替内容
	 * @returns {Binder<T>}
	 */
	/**
	 * @param {...any} p 要注册的路径
	 * @returns {Binder<T> | (() => void)}
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
	 * @returns {Binder<T>}
	 */
	/**
	 * 注册 HTTP POST 处理函数
	 * @overload
	 * @param {TemplateStringsArray} template 要注册的路径模板
	 * @param {...any} substitutions 要注册的路径模板代替内容
	 * @returns {Binder<T>}
	 */
	/**
	 * @param {...any} p 要注册的路径
	 * @returns {Binder<T> | (() => void)}
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
	 * @returns {Binder<T>}
	 */
	/**
	 * 注册 HTTP PUT 处理函数
	 * @overload
	 * @param {TemplateStringsArray} template 要注册的路径模板
	 * @param {...any} substitutions 要注册的路径模板代替内容
	 * @returns {Binder<T>}
	 */
	/**
	 * @param {...any} p 要注册的路径
	 * @returns {Binder<T> | (() => void)}
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
	 * @returns {Binder<T>}
	 */
	/**
	 * 注册 HTTP DELETE 处理函数
	 * @overload
	 * @param {TemplateStringsArray} template 要注册的路径模板
	 * @param {...any} substitutions 要注册的路径模板代替内容
	 * @returns {Binder<T>}
	 */
	/**
	 * @param {...any} p 要注册的路径
	 * @returns {Binder<T> | (() => void)}
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
	 * @returns {Binder<T>}
	 */
	/**
	 * 注册 HTTP HEAD 处理函数
	 * @overload
	 * @param {TemplateStringsArray} template 要注册的路径模板
	 * @param {...any} substitutions 要注册的路径模板代替内容
	 * @returns {Binder<T>}
	 */
	/**
	 * @param {...any} p 要注册的路径
	 * @returns {Binder<T> | (() => void)}
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
	 * @returns {Binder<T>}
	 */
	/**
	 * 注册 HTTP OPTIONS 处理函数
	 * @overload
	 * @param {TemplateStringsArray} template 要注册的路径模板
	 * @param {...any} substitutions 要注册的路径模板代替内容
	 * @returns {Binder<T>}
	 */
	/**
	 * @param {...any} p 要注册的路径
	 * @returns {Binder<T> | (() => void)}
	 */
	options(...p) { return verb(this.#routes, ['OPTIONS'], p); }
}
