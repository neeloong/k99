import type { Context, Service, ServiceContext } from '../types/context';
import type { CookieClearOption } from '../types/cookie';
import type { Environment } from '../types/Environment';
import type { Method } from '../types/method';
import type { CookieInfo } from './cookie';
import createBody from './createBody';
import {
	clearCookie, getCookie, getRequestCookies, getCookieHeader,
} from './cookie';

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
const noBodyMethods = new Set(['GET', 'OPTIONS']);


const hostRegex = /^(\[[^\]]+\]|^:):(\d+)$/;

export default function createContext(
	request: Request,
	fetch: (request: Request) => Promise<Response | null>,
	environment?: Environment,
	parent?: Context,
) {
	const method = (request.method || 'GET').toUpperCase() as Method;
	const urlObj = new URL(request.url);
	const url = `${ urlObj.pathname }${ urlObj.search }` || '/';
	const { signal, headers } = request;
	const pathname = urlObj.pathname || '/';
	const search = urlObj.search || '';
	const query = parseQuery(search.substring(1));

	const services = new Map<Service<any, any, any>, ServiceContext<any, false>>();

	const host = headers.get('host') || '';
	const hostInfo = hostRegex.exec(host);
	const [hostname = urlObj.hostname, port = urlObj.port] = hostInfo ? [hostInfo[1], hostInfo[2]] : [host, ''];

	const cookies = getRequestCookies(headers.get('cookie') || '');
	const sentCookies: CookieInfo[] = [];


	let status = 200;
	const responseHeaders = new Headers();
	let destroyed = false;
	const root = parent?.root;
	let hasError: any = null;

	let params: any = {};
	const context: Context = {
		environment,
		parent,
		get error() { return hasError; },
		get root() { return root || this; },
		signal,
		fetch: ({ method: m, path, signal, body, headers }) => {
			const url = new URL(path, urlObj);
			const method = (m || 'GET').toUpperCase();
			return fetch(new Request(url, {
				method,
				headers: new Headers(headers || {}),
				signal,
				body: !body || noBodyMethods.has(method) ? null : createBody(body),
			}));
		},
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
		requestHeaders: headers,
		host, hostname, port,
		requestType: headers.get('content-type') || '',
		referer: headers.get('referer') || '',
		userAgent: headers.get('user-agent') || '',
		accept: (headers.get('accept') || '').split(/,\s*/).filter(Boolean),
		acceptLanguage: (headers.get('accept-language') || '')
			.split(/,\s*/)
			.filter(Boolean),
		cookies,
		request,

		get destroyed() { return destroyed; },
		get status() { return status; },
		set status(v) { status = v; },
		get location() { return responseHeaders.get('location') || ''; },
		set location(url) { responseHeaders.set('location', url); },
		get responseType() { return responseHeaders.get('content-type') || ''; },
		set responseType(v) { responseHeaders.set('content-type', v); },
		getCookie(name?: string) { return getCookie(sentCookies, name); },
		setCookie(
			name,
			value,
			{ expire, domain, path, secure, httpOnly } = {},
		) {
			sentCookies.push({
				name, value, expire, domain, path, secure, httpOnly,
			});
			responseHeaders.delete('set-cookie');
			for (const v of getCookieHeader(sentCookies)) {
				responseHeaders.set('set-cookie', v);
			}
		},
		clearCookie(
			name?: string | CookieClearOption,
			opt?: CookieClearOption | boolean,
		): void {
			clearCookie(sentCookies, cookies, name, opt);
			for (const v of getCookieHeader(sentCookies)) {
				responseHeaders.set('set-cookie', v);
			}
		},
		responseHeaders,
	};
	return {
		context,
		setParams: (v: any) => { params = v; },
		destroy: (error?: boolean) => {
			if (destroyed) { return; }
			destroyed = true;
			if (error) { hasError = error; }
			destroyServices(services, environment);
		},
	};
}
