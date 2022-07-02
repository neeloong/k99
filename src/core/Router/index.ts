import type { Method, Handler, Route, Guard, RouterRoute } from '../types';
import createMatch from './createMatch';
export const methods = new Set(['GET', 'POST', 'PUT', 'DELETE', 'HEAD']);

function isMethod(v: any): v is Method {
	return methods.has(v);
}
function getMethods(methods: Method | Iterable<Method>): Method[] {
	if (typeof methods === 'string') {
		return [methods.toUpperCase()].filter(isMethod);
	}
	if (methods && typeof methods[Symbol.iterator] === 'function') {
		return [...methods]
			.map(v => typeof v === 'string' && v.toUpperCase())
			.filter(isMethod);
	}
	if (length in methods) {
		return Array.from(methods)
			.map(v => typeof v === 'string' && v.toUpperCase())
			.filter(isMethod);
	}
	return ['GET', 'POST', 'PUT', 'DELETE'];
}


export default class Router {
	disabled = false;
	/** 路由列表 */
	private readonly __routes: (Route | RouterRoute)[] = [];
	readonly plugin?: string;
	constructor( plugin?: string) {
		this.plugin = plugin;
	}
	/** 子路由 */
	route(router: Router): Router;
	route(path: string, router: Router): Router;
	route(path: string, plugin?: string): Router;
	route(path: string | Router, plugins?: string | Router): Router {
		if (typeof path === 'string') {
			const router = plugins instanceof Router ? plugins : new Router(plugins);
			this.__routes.push({
				path,
				match: createMatch(path, false),
				router,
			});
			return router;
		}
		const router = path instanceof Router ? path : new Router();
		this.__routes.push({
			path: '',
			match: createMatch('', false),
			router,
		});
		return router;
	}
	readonly guards = new Set<Guard>();
	/**
	 * 注册处理函数
	 * @param method  要注册的方法
	 * @param path    要注册的路径
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
			path: path.replace(/(.)\/+$/, '$1').replace(/\/+/g, '/'),
			match: createMatch(path, true),
			methods: new Set(methods),
			handlers,
		};
		const routes = this.__routes;
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
}
