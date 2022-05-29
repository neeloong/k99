import type App from '../App';
import type { Method } from './router';
import type { K99Headers } from './K99Headers';
import type { CookieClearOption, CookieOption, CookieOptionInfo } from './cookie';
import type { Encoding, HexEncoding, WriteType } from './writeType';
import type {K99Response} from './K99Response';
import type { Setting } from './Setting';
import type { Asset } from './Asset';
import type { Log } from './Log';
import type { K99Request } from './K99Request';
import type { MaybePromise } from './promise';

interface ServiceExecContext<D> extends Context { readonly channel: 'exec'; readonly state: D; }
interface ServiceDestroyContext<D> extends Context { readonly channel: 'destroy'; readonly state: D; }
interface GuardTestContext<D> { readonly channel: 'test'; readonly state: D; }
interface GuardClearContext<D> { readonly channel: 'clear'; readonly state: D; }
export type ServiceContext<D> =
	| ServiceExecContext<D>
	| ServiceDestroyContext<D>
	| GuardTestContext<D>
	| GuardClearContext<D>;

export interface Service<T, D extends object, P extends any[] = []> {
	(ctx: ServiceExecContext<D>, ...p: P): T;
	(ctx: ServiceDestroyContext<D>): MaybePromise<void>;
}
export interface Guard<T, D extends object, P extends any[] = any[]> extends Service<T, D, P> {
	(ctx: GuardTestContext<D>, params: any, method: Method): MaybePromise<boolean | D>;
	(ctx: GuardClearContext<D>): MaybePromise<any>;
}

export interface Context {
	/** 渠道，仅在服务中有效 */
	readonly channel?: string;
	/** 当前的路由 */
	readonly app: App;
	readonly setting: Setting;
	readonly asset: Asset;
	readonly log: Log;
	/** 当前的路由 */
	readonly parent?: Context;
	/** 当前的路由 */
	readonly root: Context;
	readonly abort?: Promise<null>;
	/** 虚拟请求 */
	request(
		opt: {
			method: Method,
			path: string,
			body?: K99Request.Reader | WriteType,
			headers?: K99Headers,
			abort?: Promise<void>,
		}
	): Promise<null | K99Response>
	/** 调用服务 */
	service<T, P extends any[] = []>(Service: Service<T, any, P>, ...p: P): T;


	/** 请求 url (不含协议及主机名等) */
	readonly url: string;
	/** 路径参数 */
	readonly params: Readonly<{[p: string]: string}>;
	/** 请求方法 */
	readonly method: Method;
	/** 请求路径 */
	readonly pathname: string;
	/** 查询字符串 */
	readonly search: string;
	/** 查询参数 */
	readonly query: Record<string, string | string[] | undefined>;
	/** 请求头 */
	readonly headers: Readonly<K99Headers>;
	/** 请求主机 */
	readonly host: string;
	/** 请求主机名 */
	readonly hostname: string;
	/** 请求端口 */
	readonly port: string;
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
	/** 读取请求体 */
	read(size?: number, encoding?: null): Promise<Uint8Array | null>;
	read(size: number, encoding: Encoding | HexEncoding): Promise<string | null>;
	read(size?: number, encoding?: Encoding | HexEncoding | null): Promise<string | Uint8Array | null>;

	/** 会话是否已经结束 */
	readonly destroyed: boolean;
	/** 输出是否已经因为各种原因结束 */
	readonly finished: boolean;
	/** 响应头是否已经被发送 */
	readonly headersSent: boolean;
	/** 状态码 */
	status: number;
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
	hasHeader(name: string): boolean;
	/** 获取全部相应头名称 */
	getHeaderNames(): string[];
	/** 获取全部相应头 */
	getHeaders(): K99Headers;
	/**
	 * 获取设置相应头
	 * @param name  被相应头名称
	 */
	getHeader<T extends keyof K99Headers>(
		name: T
	): K99Headers[T] | undefined;
	/**
	 * 设置或删除相应头
	 * @description 如果未传第二个参数，或第二个参数值为 undefined, 则表示删除该相应头
	 * @param name  被设置或删除的相应头名称
	 * @param value 相应头的值，未传或为 undefined, 则表示删除
	 */
	setHeader<T extends keyof K99Headers>(
		name: T,
		value?: K99Headers[T]
	): void;
	/** 将数据写入相应 */
	write(chunk: WriteType): Promise<boolean>;
}
