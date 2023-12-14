import type { Context, Service, ServiceContext } from '../types/context';
import type { CookieClearOption } from '../types/cookie';
import type { Environment } from '../types/Environment';
import type { K99Headers } from '../types/K99Headers';
import type { Method } from '../types/method';
import type { WriteType } from '../types/WriteType';
import type { CookieInfo } from './cookie';
import {
	clearCookie, getCookie, getRequestCookies, getCookieHeader,
} from './cookie';
import createRead from './createRead';

function getNameValue(s: string): [string, string] {
	const index = s.indexOf('=');
	if (index < 0) {
		return [decodeURIComponent(s), ''];
	}
	return [
		decodeURIComponent(s.substring(0, index)),
		decodeURIComponent(s.substring(index + 1)),
	];

}
function parseQuery(s: string): Record<string, string | string[]> {
	const query: Record<string, string | string[]> = {};
	for (const k of s.split('&').filter(Boolean)) {
		const [index, value] = getNameValue(k);
		if (index in query) {
			query[index] = [query[index], value].flat();
		} else {
			query[index] = value;
		}
	}
	return query;
}


function getHeaders(h: Headers) {
	const headers: K99Headers = {};
	for (const [k, v] of h.entries()) {
		headers[k.toLowerCase()] = v;
	}
	return headers;
}

function destroyServices(
	services: Map<Service<any, any, any>, object>,
	environment?: Environment,
) {
	let promise: Promise<void> = Promise.resolve();
	for (const [service, context] of [...services.entries()]) {
		promise = promise.then(() => service(Object.create(context, {
			destroying: {
				value: true,
				configurable: true,
				enumerable: true,
			},
		}))).catch(e => environment?.error?.(e));
	}
	return promise;
}

const hostRegex = /^(\[[^\]]+\]|^:):(\d+)$/;

export default function createContext(
	req: Request,
	request: (opt: {
		method: Method;
		path: string;
		body?: WriteType | undefined;
		headers?: K99Headers | undefined;
		signal?: AbortSignal | undefined;
	}) => Promise<Response | null>,
	environment?: Environment,
	parent?: Context,
) {
	const method = (req.method || 'GET').toUpperCase()  as Method;
	const urlObj = new URL(req.url);
	const url = `${ urlObj.pathname }${ urlObj.search }` || '/';
	const {body, signal} = req;
	const headers = getHeaders(req.headers);
	const pathname =  urlObj.pathname || '/';
	const search = urlObj.search || '';
	const query = parseQuery(search.substring(1));

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
	let hasError: any = null;

	let params: any = {};
	const context: Context = {
		environment,
		parent,
		get error() { return hasError; },
		get root() { return root || this; },
		signal, request,
		service(service, ...p) {
			if (service.rootOnly && root) {
				return root.service(service, ...p);
			}
			let serviceContext = services.get(service);
			if (!serviceContext) {
				let state: any;
				serviceContext = Object.create(context, {
					destroying: {
						value: false,
						configurable: true,
						enumerable: true,
					},
					currentService: {
						value: service,
						configurable: true,
						enumerable: true,
					},
					state: {
						configurable: true,
						enumerable: true,
						get() { return state; },
						set(s) { state = s; },
					},
				}) as ServiceContext<any, false>;
				services.set(service, serviceContext);
			}
			return service(serviceContext, ...p);
		},

		method, url, pathname, search, query,
		get params() { return params; },
		headers: Object.freeze({ ...headers }),
		host, hostname, port,
		requestType: headers['content-type'] || '',
		referer: headers.referer || '',
		userAgent: headers['user-agent'] || '',
		accept: (headers.accept || '').split(/,\s*/).filter(Boolean),
		acceptLanguage: (headers['accept-language'] || '')
			.split(/,\s*/)
			.filter(Boolean),
		cookies,
		read: createRead(body),

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
		getHeaders() { return { ...resHeaders }; },
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
		destroy: (error?: boolean) => {
			if (destroyed) { return; }
			destroyed = true;
			headersSent = true;
			if (error) { hasError = error; }
			destroyServices(services, environment);
		}, sendHeaders() {
			if (headersSent) {
				return false;
			}
			headersSent = true;
			return true;
		},
	};
}
