import type Handler from '../types/handle';
import type Method from '../types/method';

import Router, { FindItem } from '../Router';
import toMatch from './toMatch';

import type{ Match } from './toMatch';
import verb from './verb';
import getMethods from './getMethods';
export type{ Match } from './toMatch';


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
	 * @param plugin 要注册的子路由所属的插件
	 */
	route(path: string, plugin?: string): ApiRouter;
	route(path: string | Router, plugins?: string | Router): Router {
		const r = typeof path === 'string' ? plugins : path;
		const router = r instanceof Router ? r : new ApiRouter();
		const p = typeof path === 'string' ? path : '';
		this.#routes.push({ match: toMatch(p, false), router });
		return router;
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
		handler: Handler): () => void;
	verb(
		methods: Method | Iterable<Method> | ArrayLike<Method>,
		path?: string | Handler,
		handler?: Handler
	) {
		const allMethods = getMethods(methods);
		if (!allMethods.length) { return () => {}; }
		return verb(this.#routes, allMethods, path, handler);
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
	match(path?: string | Handler, handler?: Handler) {
		const methods: Method[] = ['GET', 'POST', 'PUT', 'DELETE'];
		return verb(this.#routes, methods, path, handler);
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
	get(path?: string | Handler, handler?: Handler) {
		return verb(this.#routes, ['GET'], path, handler);
	}
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
	post(path?: string | Handler, handler?: Handler) {
		return verb(this.#routes, ['POST'], path, handler);
	}
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
	put(path?: string | Handler, handler?: Handler) {
		return verb(this.#routes, ['PUT'], path, handler);
	}
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
	delete(path?: string | Handler, handler?: Handler) {
		return verb(this.#routes, ['DELETE'], path, handler);
	}
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
	head(path?: string | Handler, handler?: Handler) {
		return verb(this.#routes, ['HEAD'], path, handler);
	}
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
	options(path?: string | Handler, handler?: Handler) {
		return verb(this.#routes, ['OPTIONS'], path, handler);
	}
}
