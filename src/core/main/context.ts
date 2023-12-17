import type { Context, Service, ServiceContext } from '../types/context';
import type { CookieClearOption } from '../types/cookie';
import type { Environment } from '../types/Environment';
import type { Method } from '../types/method';
import type { CookieInfo } from './cookie';
import {
	clearCookie, getCookie, getRequestCookies, getCookieHeader,
} from './cookie';
import toBodyData from './toBodyData';


const noBodyMethods = new Set(['GET', 'OPTIONS']);
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


export default function createContext(
	request: Request,
	fetch: (request: Request) => Promise<Response | null>,
	environment?: Environment,
	parent?: Context,
) {
	const method = (request.method || 'GET').toUpperCase() as Method;
	const url = new URL(request.url);
	const { signal, headers } = request;

	const services = new Map<Service<any, any, any>, ServiceContext<any, false>>();


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
		url,
		fetch: (input, { method = 'get', signal, body: data, headers: h } = {}) => {
			const fetchUrl = new URL(input, url);
			const headers =  new Headers(h || {});
			if (!data || noBodyMethods.has(method.toUpperCase())) {
				return fetch(new Request(fetchUrl, { method, headers, signal }));
			}
			const bodyData = toBodyData(data);
			if (!bodyData) {
				return fetch(new Request(fetchUrl, { method, headers, signal }));
			}
			const [body, size, type] = bodyData;
			if (type && !headers.get('Content-Type')) {
				headers.set('Content-Type', type);
			}
			if (size > 0 && !headers.get('Content-Length')) {
				headers.set('Content-Length', String(size));
			}
			return fetch(new Request(fetchUrl, { method, headers, signal, body }));
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

		method,
		get params() { return params; },
		requestHeaders: headers,
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
				responseHeaders.append('set-cookie', v);
			}
		},
		clearCookie(
			name?: string | CookieClearOption,
			opt?: CookieClearOption | boolean,
		): void {
			clearCookie(sentCookies, cookies, name, opt);
			responseHeaders.delete('set-cookie');
			for (const v of getCookieHeader(sentCookies)) {
				responseHeaders.append('set-cookie', v);
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
