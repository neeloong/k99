import type { CookieClearOption, CookieOption, CookieOptionInfo } from './cookie';
import type { Method } from './method';
import type { Environment } from './Environment';

export interface ServiceContext<T, D extends boolean = boolean> extends Context {
	readonly destroying: D;
	readonly currentService?: Service<any, any, any>;
	state?: T;
	[key: string]: any;
}

export interface Service<T, D, P extends any[] = []> extends Service.Options {
	(ctx: ServiceContext<D, false>, ...p: P): T;
	(ctx: ServiceContext<D, true>): PromiseLike<void> | void;
}
export declare namespace Service {
	export interface Options {
		readonly rootOnly?: boolean;
	}
}
export type StoreService<T> = Service<T | undefined, T, [s?: T]>;
export type StateService<T> = Service<T, T, []>;
export interface Context {
	readonly environment?: Environment;
	/** 当前的路由 */
	readonly parent?: Context;
	/** 当前的路由 */
	readonly root: Context;
	readonly error: any;
	readonly signal: AbortSignal;
	/** 虚拟请求 */
	fetch(input: string | URL, init?: {
		method?: Method;
		body?: BodyInit | Iterable<Uint8Array> | AsyncIterable<Uint8Array> | object | null;
		headers?: HeadersInit;
		signal?: AbortSignal | null;
	}): Promise<Response | null>
	/** 调用服务 */
	service<T, P extends any[] = []>(Service: Service<T, any, P>, ...p: P): T;


	/** 请求 url (不含协议及主机名等) */
	readonly url: URL;
	/** 路径参数 */
	readonly params: Readonly<{ [p: string]: string }>;
	/** 请求方法 */
	readonly method: Method;
	/** 请求头 */
	readonly requestHeaders: Headers;
	/** content-type 请求头 */
	readonly requestType: string;
	/** 来源路径 */
	readonly referer: string;
	/** 客户端 UA */
	readonly userAgent: string;
	/** 请求 accept */
	readonly accept: string[];
	/** 请求 accept language */
	readonly acceptLanguage: string[];

	/** 请求 cookie */
	readonly cookies: Readonly<{ [key: string]: string; }>;
	readonly request: Request;

	/** 会话是否已经结束 */
	readonly destroyed: boolean;
	/** 状态码 */
	status: number;
	readonly responseHeaders: Headers;
	/** location 相应头 */
	location: string | number | string[];
	/** content-type 相应头 */
	responseType: string | number | string[];
	/** 获取已设置的 cookie 信息 */
	getCookie(name?: string): Iterable<CookieOptionInfo>;
	/**
	 * 设置 cookie
	 * @param name cookie 名称
	 * @param value cookie 内容
	 * @param option 选项
	 */
	setCookie(name: string, value: string, opt?: CookieOption): void;
	/**
	 * 清除 cookie
	 * @param name  cookie 名称
	 * @param option 选项
	 */
	clearCookie(name: string, option?: CookieClearOption): void;
	/**
	 * 清除所有的 cookie
	 * @param option 选项
	 * @param includeRequest 是否包括请求 cookie 在内的 cookie 都要清除
	 */
	clearCookie(option?: CookieClearOption, includeRequest?: boolean): void;
}
