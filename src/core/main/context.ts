import type { Context, Service } from '../types/context';
import type { CookieClearOption } from '../types/cookie';
import type { Method } from '../types/method';
import type { CookieInfo } from './cookie';
import {
	clearCookie, getCookie, getRequestCookies, getCookieHeader,
} from './cookie';
import toBodyData from './toBodyData';


const noBodyMethods = new Set(['GET', 'OPTIONS']);


export default function createContext(
	request: Request,
	fetch: (request: Request) => Promise<Response | null>,
	getMethod?: string | ((request: Request) => string) | null,
	echoError?: ((error?: unknown) => void) | null,
	environment?: object | null,
	parent?: Context,
) {
	let methodStr = '';
	if (typeof getMethod === 'string') {
		methodStr = getMethod as Method;
	} else if (typeof getMethod === 'function') {
		methodStr = getMethod(request) as Method;
	}
	if (!methodStr || typeof methodStr !== 'string') {
		methodStr = request.method || 'GET';
	}
	const method = methodStr.toUpperCase() as Method;
	const url = new URL(request.url);
	const { signal, headers } = request;

	const services = new Map<Service<any, any>, Function>();


	const cookies = getRequestCookies(headers.get('cookie') || '');
	const sentCookies: CookieInfo[] = [];


	let status = 200;
	const responseHeaders = new Headers();
	let destroyed = false;
	const root = parent?.root;
	let hasError: any = null;

	let resolve = () => {};
	let reject = (error: unknown) => {};

	const donePromise = new Promise<void>((a, b) => { resolve = a; reject = b; });
	donePromise.catch(() => {});

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
			const headers = new Headers(h || {});
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
		done(a, b) {
			if (destroyed) { return null; }
			const result = donePromise.then(a, b);
			result.catch(echoError);
			return result;
		},
		service(service, ...p) {
			if (service.rootOnly && root) {
				return root.service(service, ...p);
			}
			let fn = services.get(service);
			if (!fn) {
				fn = service(context);
				if (typeof fn !== 'function') { return; }
				services.set(service, fn);
			}
			return fn(...p);
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
		set location(url) {
			if (url) {
				responseHeaders.set('location', url);
			} else {
				responseHeaders.delete('location');
			}
		},
		get responseType() { return responseHeaders.get('content-type') || ''; },
		set responseType(type) {
			if (type) {
				responseHeaders.set('content-type', type);
			} else {
				responseHeaders.delete('content-type');
			}
		},
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
			if (error) { reject(error); } else { resolve(); }
		},
	};
}
