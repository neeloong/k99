import type { Handler, Method } from '../main';
import type { Finder, FindItem } from '../Router';
import type { Binder } from './verb';

import Router from '../Router';
import toMatch from './toMatch';

import type{ Match } from './toMatch';
import verb from './verb';
import getMethods from './getMethods';
export type{ Match } from './toMatch';
export type{ Binder } from './verb';


export interface Route {
	/** 路径匹配 */
	match?: Match;
	router?: null;
	/** 所属插件 */
	plugin?: string;
	/** 处理函数 */
	handler: Handler
	/** 方法列表 */
	methods: Set<Method>;
}
export interface RouterRoute {
	/** 路径匹配 */
	match?: Match;
	router: Router;
}
export interface RouteBinder {
	/**
	 * 添加子路由
	 * @param router 要注册的子路由
	 */
	<T extends Router>(router: T): T;
	/**
	 * 添加子路由
	 */
	(): ApiRouter;
	/**
	 * 添加子路由
	 * @param find 要注册的子路由的 Finder
	 */
	route(find: Finder): Router;
}
function bindRouter<T extends Router>(
	routes: (Route | RouterRoute)[],
	path: string,
	r?: Router | Finder
): Router {
	const router = r instanceof Router ? r
		: typeof r === 'function' ? Router.create(r)
			: new ApiRouter();
	routes.push({ match: toMatch(path, false), router });
	return router;
}
export default class ApiRouter extends Router {
	/** 路由列表 */
	readonly #routes: (Route | RouterRoute)[] = [];
	/**
	 * 添加子路由
	 * @param router 要注册的子路由
	 */
	route<T extends Router>(router: T): T;
	/**
	 * 添加子路由
	 * @param path   要注册的路径
	 * @param router 要注册的子路由
	 */
	route<T extends Router>(path: string, router: T): T;
	/**
	 * 添加子路由
	 * @param path   要注册的路径
	 */
	route(path: string): ApiRouter;
	/**
	 * 添加子路由
	 * @param find 要注册的子路由的 Finder
	 */
	route(find: Finder): Router;
	/**
	 * 添加子路由
	 * @param path 要注册的路径
	 * @param find 要注册的子路由的 Finder
	 */
	route(path: string, find: Finder): Router;
	route(...path: Parameters<typeof String.raw>): RouteBinder;
	route(...p: any[]): Router | RouteBinder {
		const [a] = p;
		if (a && typeof a === 'object' && !(a instanceof Router)) {
			const path = String.raw(a, ...p.slice(1));
			return ((r?: Finder | Router) => bindRouter(this.#routes, path, r))as RouteBinder;
		}
		const path = typeof a === 'string' ? a : '';
		const r = typeof a === 'string' ? p[1] : a;
		return bindRouter(this.#routes, path, r);
	}
	*find(method: Method, path: string[]): Iterable<FindItem> {
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
	 * @param method  要注册的方法
	 * @param handler 要注册的处理函数
	 */
	verb(
		methods: Method | Iterable<Method> | ArrayLike<Method>,
		handler: Handler
	): () => void;
	/**
	 * 注册处理函数
	 * @param method  要注册的方法
	 * @param path    要注册的路径
	 * @param handler 要注册的处理函数
	 */
	verb(
		methods: Method | Iterable<Method> | ArrayLike<Method>,
		path: string,
		handler: Handler
	): () => void;
	/**
	 * 注册处理函数
	 * @param method 要注册的方法
	 * @param path   要注册的路径
	 */
	verb(
		methods: Method | Iterable<Method> | ArrayLike<Method>,
		path: string,
	): Binder;
	verb(
		methods: Method | Iterable<Method> | ArrayLike<Method>,
		path?: string | Handler,
		handler?: Handler
	) {
		const allMethods = getMethods(methods);
		if (!allMethods.length) { return () => {}; }
		return verb(this.#routes, allMethods, [path, handler]);
	}
	/**
	 * 注册 HTTP GET/POST/PUT/DELETE 处理函数
	 * @param handler 要注册的处理函数
	 */
	match(handler: Handler): () => void;
	/**
	 * 注册处理函数
	 * @param path    要注册的路径
	 * @param handler 要注册的处理函数
	 */
	match(path: string, handler: Handler): () => void;
	/**
	 * 注册 HTTP GET/POST/PUT/DELETE 处理函数
	 * @param path 要注册的路径
	 */
	match(path: string): Binder;
	/**
	 * 注册 HTTP GET/POST/PUT/DELETE 处理函数
	 * @param path 要注册的路径
	 */
	match(...path: Parameters<typeof String.raw>): Binder;
	match(...p: any[]) {
		return verb(this.#routes, ['GET', 'POST', 'PUT', 'DELETE'], p);
	}
	/**
	 * 注册 HTTP GET 处理函数
	 * @param handler 要注册的处理函数
	 */
	get(handler: Handler): () => void;
	/**
	 * 注册 HTTP GET 处理函数
	 * @param path    要注册的路径
	 * @param handler 要注册的处理函数
	 */
	get(path: string, handler: Handler): () => void;
	/**
	 * 注册 HTTP GET 处理函数
	 * @param path 要注册的路径
	 */
	get(path: string): Binder;
	/**
	 * 注册 HTTP GET 处理函数
	 * @param path 要注册的路径
	 */
	get(...path: Parameters<typeof String.raw>): Binder;
	get(...p: any[]) { return verb(this.#routes, ['GET'], p); }
	/**
	 * 注册 HTTP POST 处理函数
	 * @param handler 要注册的处理函数
	 */
	post(handler: Handler): () => void;
	/**
	 * 注册 HTTP POST 处理函数
	 * @param path    要注册的路径
	 * @param handler 要注册的处理函数
	 */
	post(path: string, handler: Handler): () => void;
	/**
	 * 注册 HTTP POST 处理函数
	 * @param path 要注册的路径
	 */
	post(path: string): Binder;
	/**
	 * 注册 HTTP POST 处理函数
	 * @param path 要注册的路径
	 */
	post(...path: Parameters<typeof String.raw>): Binder;
	post(...p: any[]) { return verb(this.#routes, ['POST'], p); }
	/**
	 * 注册 HTTP PUT 处理函数
	 * @param handler 要注册的处理函数
	 */
	put(handler: Handler): () => void;
	/**
	 * 注册 HTTP PUT 处理函数
	 * @param path    要注册的路径
	 * @param handler 要注册的处理函数
	 */
	put(path: string, handler: Handler): () => void;
	/**
	 * 注册 HTTP PUT 处理函数
	 * @param path 要注册的路径
	 */
	put(path: string): Binder;
	/**
	 * 注册 HTTP PUT 处理函数
	 * @param path 要注册的路径
	 */
	put(...path: Parameters<typeof String.raw>): Binder;
	put(...p: any[]) { return verb(this.#routes, ['PUT'], p); }
	/**
	 * 注册 HTTP DELETE 处理函数
	 * @param handler 要注册的处理函数
	 */
	delete(handler: Handler): () => void;
	/**
	 * 注册 HTTP DELETE 处理函数
	 * @param path    要注册的路径
	 * @param handler 要注册的处理函数
	 */
	delete(path: string, handler: Handler): () => void;
	/**
	 * 注册 HTTP DELETE 处理函数
	 * @param path 要注册的路径
	 */
	delete(path: string): Binder;
	/**
	 * 注册 HTTP DELETE 处理函数
	 * @param path 要注册的路径
	 */
	delete(...path: Parameters<typeof String.raw>): Binder;
	delete(...p: any[]) { return verb(this.#routes, ['DELETE'], p); }
	/**
	 * 注册 HTTP HEAD 处理函数
	 * @param handler 要注册的处理函数
	 */
	head(handler: Handler): () => void;
	/**
	 * 注册 HTTP HEAD 处理函数
	 * @param path    要注册的路径
	 * @param handler 要注册的处理函数
	 */
	head(path: string, handler: Handler): () => void;
	/**
	 * 注册 HTTP HEAD 处理函数
	 * @param path 要注册的路径
	 */
	head(path: string): Binder;
	/**
	 * 注册 HTTP HEAD 处理函数
	 * @param path 要注册的路径
	 */
	head(...path: Parameters<typeof String.raw>): Binder;
	head(...p: any[]) { return verb(this.#routes, ['HEAD'], p); }
	/**
	 * 注册 HTTP OPTIONS 处理函数
	 * @param handler 要注册的处理函数
	 */
	options(handler: Handler): () => void;
	/**
	 * 注册 HTTP OPTIONS 处理函数
	 * @param path    要注册的路径
	 * @param handler 要注册的处理函数
	 */
	options(path: string, handler: Handler): () => void;
	/**
	 * 注册 HTTP OPTIONS 处理函数
	 * @param path 要注册的路径
	 */
	options(path: string): Binder;
	/**
	 * 注册 HTTP OPTIONS 处理函数
	 * @param path 要注册的路径
	 */
	options(...path: Parameters<typeof String.raw>): Binder;
	options(...p: any[]) { return verb(this.#routes, ['OPTIONS'], p); }
}
