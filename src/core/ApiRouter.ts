import type Handler from './types/handle';
import type Method from './types/method';

import Router, { FindItem } from './Router';


export interface Match {
	(paths: string[]): [Record<string, string | string[]>, string[]] | undefined;
}
export interface Route {
	/** 路径匹配 */
	match?: Match;
	router?: null;
	/** 所属插件 */
	plugin?: string;
	/** 处理函数 */
	handlers: Handler[]
	/** 方法列表 */
	methods: Set<Method>;
}
export interface RouterRoute {
	/** 路径匹配 */
	match?: Match;
	router: Router;
}

const methods = new Set(['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS']);

interface Pattern {
	name: string;
	optional: boolean;
	many: boolean;
	pattern: RegExp;
}

const regex = /^:([a-zA-Z][a-zA-Z0-9]*)(?:\((.+)\))?([ius]+)?([?+*]?)$/;
function parse(p: string): Pattern | string {
	const res = regex.exec(p);
	if (!res) { return p; }
	const [, name, expression = '.*', flags, modifier] = res;
	if (!expression) {
		return {
			name, pattern: new RegExp('^.*$', flags),
			optional: modifier === '?' || modifier === '*',
			many: modifier === '+' || modifier === '*',
		};
	}
	let i = 0;
	let count = 0;
	const pattern: string[] = ['^'];
	while (i < expression.length) {
		const c = expression[i++];
		pattern.push(c);
		if (c === '\\') {
			pattern.push(expression[i++]);
			continue;
		}
		if (c === ')') {
			if (count === 0) { return p; }
			count--;
			continue;
		}
		if (c === '[') {
			while (i < expression.length) {
				const c = expression[i++];
				pattern.push(c);
				if (c === ']') { break; }
				if (c !== '\\') { continue; }
				pattern.push(expression[i++]);
			}
			continue;
		}
		if (c !== '(') { continue; }
		count++;
		if (expression[i] !== '?') { continue; }
		i += 2;
		if (expression[i - 1] === ':') { continue; }
		return p;
	}
	if (count) { return p; }
	pattern.push('$');
	return {
		name, pattern: new RegExp(pattern.join(''), flags),
		optional: modifier === '?' || modifier === '*',
		many: modifier === '+' || modifier === '*',
	};

}
function exec(
	match: (Pattern | string)[],
	path: string[],
	end: boolean
): [Record<string, string | string[]>, string[]] | undefined {
	const params: Record<string, string | string[]> = {};
	for (let i = 0; i < match.length; i++) {
		const m = match[i];
		const p = path[i];
		if (m === p) { continue; }
		if (typeof m === 'string') { return; }
		if (!p) { return m.optional ? [params, []] : undefined; }
		if (!m.pattern.test(p)) { return; }
		params[m.name] = p;
	}
	if (!end) { return [params, path.slice(match.length)]; }
	const last = match[match.length - 1];
	if (typeof last === 'string') { return; }
	if (!last.many && path.length > match.length) { return; }
	for (let j = match.length; j < path.length; j++) {
		if (!last.pattern.test(path[j])) { return; }
	}
	params[last.name] = path.slice(match.length - 1);
	return [params, []];

}

function toMatch(
	path: string,
	end: boolean,
): Match | undefined {
	const list: (Pattern | string)[] = [];
	for (const p of path.split('/')) {
		if (!p || /^\.+$/.test(p)) { continue; }
		list.push(parse(p));
	}
	if (!list.length) { return; }
	return path => exec(list, path, end);
}

function isMethod(v: any): v is Method { return methods.has(v); }

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
				yield [route.router || route.handlers, {}, path];
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
			removed = true;
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
