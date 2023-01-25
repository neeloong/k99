import type Asset from './types/Asset';
import type { Context, Service, ServiceContext } from './types/context';
import type { CookieClearOption } from './types/cookie';
import type K99Headers from './types/K99Headers';
import type K99Request from './types/K99Request';
import type Log from './types/Log';
import type Method from './types/method';
import type Setting from './types/Setting';
import type WriteType from './types/WriteType';
import {
	clearCookie, getCookie, getRequestCookies, getCookieHeader, CookieInfo,
} from './cookie';
import createRead from './createRead';


function destroyServices(
	log: Log,
	services: Map<Service<any, any, any>, object>,
) {
	let promise: Promise<void> = Promise.resolve();
	for (const [service, context] of [...services.entries()]) {
		promise = promise.then(() => service(Object.create(context, {
			destroying: {
				value: true,
				configurable: true,
				enumerable: true,
			},
		}))).catch(e => log.error(e));
	}
	return promise;
}

const hostRegex = /^(\[[^\]]+\]|^:):(\d+)$/;

export default function createContext(
	{ method, url, pathname, search, query, read, headers } : K99Request,
	setting: Setting,
	asset: Asset,
	log: Log,
	abort: Promise<null>,
	request: (opt: {
		method: Method;
		path: string;
		body?: WriteType | K99Request.Reader | undefined;
		headers?: K99Headers | undefined;
		abort?: Promise<void> | undefined;
	}) => Promise<any>,
	parent?: Context,
) {
	const services = new Map<Service<any, any, any>, ServiceContext<any, false>>();

	const host = headers.host || '';
	const hostInfo = hostRegex.exec(host);
	const [hostname, port] = hostInfo ? [hostInfo[1], hostInfo[2]] : [host, ''];

	const cookies = getRequestCookies(headers['cookie'] || '');
	const sentCookies: CookieInfo[] = [];


	let status = 200;
	let resHeaders: K99Headers = {};
	let headersSent = false;
	let destroyed = false;
	const root = parent?.root;

	let params: any = {};
	const context: Context = {
		setting, asset, log,
		parent,
		get root() { return root || this; },
		abort, request,
		service(service, ...p) {
			let serviceContext = services.get(service);
			if (!serviceContext) {
				let state: any;
				serviceContext = Object.create(context, {
					destroying: {
						value: false,
						configurable: true,
						enumerable: true,
					},
					state: {
						configurable: true,
						enumerable: true,
						get(){ return state; },
						set(s){ state = s; },
					},
				}) as ServiceContext<any, false>;
				services.set(service, serviceContext);
			}
			return service(serviceContext, ...p);
		},

		method, url, pathname, search, query,
		get params() { return params; },
		headers: Object.freeze({...headers}),
		host, hostname, port,
		requestType: headers['content-type'] || '',
		referer: headers.referer || '',
		userAgent: headers['user-agent'] || '',
		accept: (headers.accept || '').split(/,\s*/).filter(Boolean),
		acceptLanguage: (headers['accept-language'] || '')
			.split(/,\s*/)
			.filter(Boolean),
		cookies,
		read: createRead(read),

		get destroyed() { return destroyed; },
		get headersSent() { return headersSent; },
		get status() { return status; },
		set status(v) { if (headersSent) { return; } status = v; },
		get location() { return resHeaders['location'] || ''; },
		set location(url) { if (!headersSent) { resHeaders['location'] = url; } },
		get responseType() { return resHeaders['content-type'] || ''; },
		set responseType(v) {
			if (!headersSent) { resHeaders['content-type'] = v; }
		},
		getCookie(name?: string) { return getCookie(sentCookies, name); },
		setCookie(
			name,
			value,
			{ expire, domain, path, secure, httpOnly } = {},
		) {
			if (headersSent) { return; }
			sentCookies.push({
				name, value, expire, domain, path, secure, httpOnly,
			});
			resHeaders['set-cookie'] = getCookieHeader(sentCookies);
		},
		clearCookie(
			name?: string | CookieClearOption,
			opt?: CookieClearOption | boolean,
		): void {
			if (headersSent) { return; }
			clearCookie(sentCookies, cookies, name, opt);
			resHeaders['set-cookie'] = getCookieHeader(sentCookies);
		},

		hasHeader(n) { return n in resHeaders; },
		getHeaderNames() { return Object.keys(resHeaders); },
		getHeaders() { return {...resHeaders}; },
		getHeader(n) { return resHeaders[n]; },
		setHeader(n, v) {
			if (headersSent) { return; }
			if (v === undefined) {
				delete resHeaders[n];
			} else {
				resHeaders[n] = v;
			}
		},
	};
	return {
		context,
		setParams: (v: any) => { params = v; },
		destroy: () => {
			if (destroyed) { return; }
			destroyed = true;
			headersSent = true;
			destroyServices(log, services);
		}, sendHeaders(){
			if (headersSent) {
				return false;
			}
			headersSent = true;
			return true;
		}};
}
