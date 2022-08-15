import type {
	K99Request,
	K99Headers,
	CookieClearOption,
	ActionContext,
	WriteType,
	K99Response,
	Service,
	Context,
} from '../../types';
import type App from '..';
import createRequest from '../../utils/createRequest';
import find from './find';
import createWrite from './createWrite';
import {
	clearCookie, getCookie, getRequestCookies, getCookieHeader, CookieInfo,
} from './cookie';
import createRead from './createRead';
import main from './main';


function destroyServices(
	context: Context,
	services: Map<Service<any, any, any>, object>,
) {
	let promise: Promise<void> = Promise.resolve();
	const {app} = context;
	for (const [service, state] of [...services.entries()]) {
		promise = promise.then(() => service(Object.create(context, {
			channel: {value: 'destroy'},
			state: {value: state},
		}))).catch(e => app.log.error(e));
	}
	return promise;
}

const hostRegex = /^(\[[^\]]+\]|^:):(\d+)$/;

export default function callback(
	app: App,
	{ method, url, pathname, search, query, read, headers, aborted } : K99Request,
	parent?: Context,
) {
	const host = headers.host || '';
	const hostInfo = hostRegex.exec(host);
	const [hostname, port] = hostInfo ? [hostInfo[1], hostInfo[2]] : [host, ''];

	const services = new Map<Service<any, any, any>, object>();
	const cookies = getRequestCookies(headers['cookie'] || '');
	const sentCookies: CookieInfo[] = [];

	const abortPromise: Promise<null> = aborted
		? aborted.then(e => Promise.reject(e))
		: new Promise(() =>{});

	let status = 200;
	let resHeaders: K99Headers = {};
	let headersSent = false;
	let destroyed = false;
	const root = parent?.root;

	let params: any = {};
	const context: Context = {
		app, setting: app.setting, asset: app.asset, log: app.log,
		parent,
		get root() { return root || this; },
		abort: abortPromise,
		request(opt) {
			const request = createRequest(opt);
			return callback(app, request, context);
		},
		service(service, ...p) {
			let state = services.get(service);
			if (!services.has(service)) { services.set(service, state = {}); }
			return service(Object.create(context, {
				channel: {value: 'exec'},
				state: {value: state},
			}), ...p);
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

	return Promise.race([
		abortPromise,
		find(app, method, pathname.split('/').filter(Boolean), context, v => params = v, {}),
	]).then(handlers => {
		if (!handlers) {
			destroyed = true;
			headersSent = true;
			destroyServices(context, services);
			return null;
		}

		const [writable, readable, abortResponse] = createWrite();
		 abortPromise.finally(abortResponse);

		let resolve: ((any: K99Response) => void) | undefined;
		let response: K99Response | undefined;
		function send() {
			if (response) { return; }
			headersSent = true;
			response = {
				...readable,
				get status() { return status; },
				get finished() { return writable.ended; },
				headers: Object.freeze({...resHeaders}),
				[Symbol.asyncIterator]() { return readable; },
			};
			if (resolve) { resolve(response); }
		}
		const contextS: Omit<ActionContext, keyof Context> = {
			get finished() { return writable.ended; },
			write(chunk: WriteType): Promise<boolean> {
				send();
				return writable.write(chunk);
			},
		};

		const actionContext: ActionContext = Object.create(
			context,
			Object.getOwnPropertyDescriptors(contextS),
		);
		Promise.race([
			abortPromise,
			main(actionContext, handlers).catch(e => app.log.error(e)),
		]).finally(() => {
			destroyed = true;
			send();
			destroyServices(context, services);
			writable.end();
		});

		return new Promise<K99Response>(r => {
			if (response) { r(response); } else { resolve = r; }
		});
	}, e => {
		destroyed = true;
		headersSent = true;
		destroyServices(context, services);
		return Promise.reject(e);
	});
}
