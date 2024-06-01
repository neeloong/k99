import type {
	Cookie, CookieOption, Method, Context, Service, Options, FindHandler,
} from './types';

import toBody from './toBody';
import {
	clearCookie, getCookie, getRequestCookies, setCookiesHeader,
} from './cookie';

export type {
	CookieOption, Cookie,
	Method, Context, Service, StateService, StoreService,
	Runner, Options, Handler, HandlerResult, FindHandler,
} from './types';

const noBodyMethods = new Set(['GET', 'OPTIONS']);
function signal2promise(signal: AbortSignal) {
	return new Promise<never>((_, reject) => {
		if (signal.aborted) {
			return reject(signal.reason);
		}
		signal.addEventListener(
			'abort',
			() => reject(signal.reason),
			{ once: true }
		);
	});
}


function setHeader(headers: Headers, name: string, value?: string) {
	if (value) {
		headers.set(name, value);
	} else {
		headers.delete(name);
	}
}
function getMethod(request: Request, toMethod?: string | ((request: Request) => string)) {
	let methodStr = '';
	if (typeof toMethod === 'string') {
		methodStr = toMethod;
	} else if (typeof toMethod === 'function') {
		methodStr = toMethod(request);
	}
	if (!methodStr || typeof methodStr !== 'string') {
		methodStr = request.method || 'GET';
	}
	return methodStr.toUpperCase() as Method;
}
export default function main(
	request: Request,
	getHandler: FindHandler,
	{ runner, error: echoError, method: toMethod, environment }: Options = {},
): Promise<Response | null> {
	function exec(request: Request, parent?: Context) {
		const method = getMethod(request, toMethod);
		const url = new URL(request.url);
		const { signal, headers } = request;
		const aborted = signal2promise(signal);
		const services = new Map<Service<any, any>, Function>();
		const cookies = getRequestCookies(headers.get('cookie') || '');
		const sentCookies: Cookie[] = [];
		const responseHeaders = new Headers();
		const root = parent?.root;
		let status = 200;
		let destroyed = false;
		let error: any = null;

		let resolve = () => {};
		let reject = (error: unknown) => {};
		const donePromise = new Promise<void>((a, b) => { resolve = a; reject = b; });
		donePromise.catch(() => {});

		let params: any = {};
		const context: Context = {
			environment,
			parent,
			get error() { return error; },
			get root() { return root || this; },
			signal,
			url,
			fetch(input, { method = 'get', signal, body: data, headers: h } = {}) {
				const fetchUrl = new URL(input, url);
				const headers = new Headers(h || {});
				if (!data || noBodyMethods.has(method.toUpperCase())) {
					return exec(new Request(fetchUrl, { method, headers, signal }), context);
				}
				const body = toBody(data, headers);
				return exec(new Request(fetchUrl, { method, headers, signal, body }), context);
			},
			done(onfulfilled, onrejected) {
				if (destroyed) { return null; }
				const result = donePromise.then(onfulfilled, onrejected);
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
			responseHeaders,
			get location() { return responseHeaders.get('location') || ''; },
			set location(url) { setHeader(responseHeaders, 'location', url); },
			get responseType() { return responseHeaders.get('content-type') || ''; },
			set responseType(type) { setHeader(responseHeaders, 'content-type', type); },
			getCookie(name) { return getCookie(sentCookies, name); },
			setCookie(name, value, { expire, domain, path, secure, httpOnly } = {}) {
				sentCookies.push({name, value, expire, domain, path, secure, httpOnly});
				setCookiesHeader(responseHeaders, sentCookies);
			},
			clearCookie(
				name?: string | CookieOption,
				opt?: CookieOption | boolean,
			): void {
				clearCookie(sentCookies, cookies, name, opt);
				setCookiesHeader(responseHeaders, sentCookies);
			},
		};
		function run() {
			return Promise.race([
				aborted,
				Promise.resolve().then(() => getHandler(context, v => { params = v; })),
			]).then(handler => handler ? Promise.race([aborted, handler(context)]).then(result => {
				if (result instanceof Response) {
					return result;
				}
				const headers = new Headers(context.responseHeaders);
				const { status } = context;
				if (!result) { return new Response(null, { status, headers }); }
				const body = toBody(result, headers, aborted);
				return new Response(body, { status, headers });
			}) : null).then(response => {
				destroyed = true;
				resolve();
				return response;
			}, e => {
				destroyed = true;
				error = e || true;
				reject(error);
				return Promise.reject(e);
			});
		}
		return runner ? runner(context, run) : run();
	}
	return exec(request);
}
