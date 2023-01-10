import type { Method, Handler, Route, RouterRoute } from '../types';
import toMatch from './toMatch';
import getMethods from './getMethods';
import Router from '../Router';


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
		if (typeof path === 'string') {
			const router = plugins instanceof Router
				? plugins
				: new ApiRouter(plugins);
			this.#routes.push({
				match: toMatch(path, false),
				router,
			});
			return router;
		}
		const router = path instanceof Router ? path : new ApiRouter();
		this.#routes.push({
			match: toMatch('', false),
			router,
		});
		return router;
	}
	*find(
		method: Method, path: string[],
	): Iterable<[Handler[] | Router, Record<string, any>, string[]]> {
		if (!path.length){
			for (const route of Array.from(this.#routes)) {
				if (route.match) { continue; }
				if (!route.router && !route.methods.has(method)) { continue; }
				yield [route.router || route.handlers, {}, []];
			}
			return;
		}
		for (const route of Array.from(this.#routes)) {
			if (!route.router && !route.methods.has(method)) { continue; }
			const {match} = route;
			if (!match) {
				yield [route.router || route.handlers, {}, path];
				continue;
			}
			const result = match(path);
			if (!result) { continue; }
			yield [route.router || route.handlers, ...result];
		}
	}
	/**
	 * 注册处理函数
	 * @param method   要注册的方法
	 * @param path     要注册的路径
	 * @param handlers 要注册的处理函数
	 */
	verb(
		methods: Method | Iterable<Method> | Method[],
		path: string,
		...handlers: Handler[]
	) {
		methods = getMethods(methods);
		if (!(methods as Method[]).length) { return null; }

		const route: Route = {
			match: toMatch(path, true),
			methods: new Set(methods),
			handlers,
		};
		const routes = this.#routes;
		routes.push(route);
		let removed = false;
		return () => {
			if (removed) { return; }
			const index = routes.indexOf(route);
			if (index < 0) { return; }
			routes.splice(index, 1);
		};
	}

	/**
	 * 注册 HTTP GET 处理函数
	 * @param path     要注册的路径
	 * @param handlers 要注册的处理函数
	 */
	 get(path: string, ...handlers: Handler[]) {
		return this.verb('GET', path, ...handlers);
	}
	/**
	 * 注册 HTTP POST 处理函数
	 * @param path     要注册的路径
	 * @param handlers 要注册的处理函数
	 */
	post(path: string, ...handlers: Handler[]) {
		return this.verb('POST', path, ...handlers);
	}
	/**
	 * 注册 HTTP PUT 处理函数
	 * @param path     要注册的路径
	 * @param handlers 要注册的处理函数
	 */
	put(path: string, ...handlers: Handler[]) {
		return this.verb('PUT', path, ...handlers);
	}
	/**
	 * 注册 HTTP DELETE 处理函数
	 * @param path     要注册的路径
	 * @param handlers 要注册的处理函数
	 */
	delete(path: string, ...handlers: Handler[]) {
		return this.verb('DELETE', path, ...handlers);
	}
	/**
	 * 注册 HTTP HEAD 处理函数
	 * @param path     要注册的路径
	 * @param handlers 要注册的处理函数
	 */
	head(path: string, ...handlers: Handler[]) {
		return this.verb('HEAD', path, ...handlers);
	}
	/**
	 * 注册 HTTP OPTIONS 处理函数
	 * @param path     要注册的路径
	 * @param handlers 要注册的处理函数
	 */
	options(path: string, ...handlers: Handler[]) {
		return this.verb('OPTIONS', path, ...handlers);
	}
}
