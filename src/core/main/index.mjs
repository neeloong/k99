
import toBody from './toBody.mjs';
import {
	clearCookie, getCookie, getRequestCookies, setCookiesHeader,
} from './cookie.mjs';

const noBodyMethods = new Set(['GET', 'OPTIONS']);
/**
 *
 * @param {AbortSignal} signal
 * @returns {Promise<never>}
 */
function signal2promise(signal) {
	return new Promise((_, reject) => {
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

/**
 *
 * @param {Headers} headers
 * @param {string} name
 * @param {string} [value]
 */
function setHeader(headers, name, value) {
	if (value) {
		headers.set(name, value);
	} else {
		headers.delete(name);
	}
}
/**
 *
 * @param {Request} request
 * @param {string | ((request: Request) => string)} [toMethod]
 * @returns {import('./types').Method}
 */
function getMethod(request, toMethod) {
	let methodStr = '';
	if (typeof toMethod === 'string') {
		methodStr = toMethod;
	} else if (typeof toMethod === 'function') {
		methodStr = toMethod(request);
	}
	if (!methodStr || typeof methodStr !== 'string') {
		methodStr = request.method || 'GET';
	}
	return /** @type {import('./types').Method} */(methodStr.toUpperCase());
}
/**
 *
 * @param {Request} request
 * @param {import('./types').FindHandler} getHandler
 * @param {import('./types').Options} [options]
 * @returns {Promise<Response | null>}
 */
export default function main(
	request, getHandler,
	{ runner, error: echoError, method: toMethod, environment } = {},
) {
	/**
	 *
	 * @param {Request} request
	 * @param {import('./types').Context} [parent]
	 * @returns {Promise<Response | null>}
	 */
	function exec(request, parent) {
		const method = getMethod(request, toMethod);
		const url = new URL(request.url);
		const { signal, headers } = request;
		const aborted = signal2promise(signal);
		/** @type {Map<import('./types').Service<any, any>, Function>} */
		const services = new Map();
		const cookies = getRequestCookies(headers.get('cookie') || '');
		/** @type {import('./types').Cookie[]} */
		const sentCookies = [];
		const responseHeaders = new Headers();
		const root = parent?.root;
		let status = 200;
		let destroyed = false;
		/** @type {any} */
		let error = null;

		let resolve = () => {};
		/** @type {(error: unknown) => void} */
		let reject = () => {};
		/** @type {Promise<void>} */
		const donePromise = new Promise((a, b) => { resolve = a; reject = b; });
		donePromise.catch(() => {});

		/** @type {any} */
		let params = {};
		/** @type {import('./types').Context} */
		const context = {
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
			/**
			 *
			 * @param {string | import('./types').CookieOption} [name]
			 * @param {import('./types').CookieOption | boolean} [opt]
			 * @returns {void}
			 */
			clearCookie(name, opt) {
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
