import type {
	K99Request,
	K99Headers,
	CookieClearOption,
	Context,
	WriteType,
	K99Response,
	Service,
	Handler,
	Guard,
} from '../../types';
import type Router from '../../Router';
import type App from '..';
import createRequest from '../../utils/createRequest';
import find from './find';
import createWrite from './createWrite';
import {
	clearCookie, getCookie, getRequestCookies, getCookieHeader, CookieInfo,
} from './cookie';
import createRead from './createRead';
import main from './main';


const hostRegex = /^(\[[^\]]+\]|^:):(\d+)$/;

function run(
	app: App,
	{ method, url, pathname, search, query, read, headers } : K99Request,
	services: Map<Service<any, any, any>, object>,
	router: Router,
	handlers: Handler[],
	params: any,
	abortPromise: Promise<null>,
	parent?: Context,
) {
	const host = headers.host || '';
	const hostInfo = hostRegex.exec(host);
	const [hostname, port] = hostInfo ? [hostInfo[1], hostInfo[2]] : [host, ''];

	const cookies = getRequestCookies(headers['cookie'] || '');
	const sentCookies: CookieInfo[] = [];
	const [writable, readable, abortResponse] = createWrite();
	let status = 200;
	let resHeaders: K99Headers = {};
	let resolve: ((any: K99Response) => void) | undefined;
	let response: K99Response | undefined;
	let destroyed = false;
	function send() {
		if (response) { return; }
		response = {
			...readable,
			get status() { return status; },
			get finished() { return writable.ended; },
			headers: Object.freeze({...resHeaders}),
			[Symbol.asyncIterator]() { return readable; },
		};
		if (resolve) { resolve(response); }
	}
	const root = parent?.root;

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

		method, url, pathname, search, query, params,
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

		/** 当前对象是否已经被销毁 */
		get destroyed() { return destroyed; },
		/** 相应是否已结束 */
		get finished() { return writable.ended; },
		/** 响应头是否已经被发送 */
		get headersSent() { return Boolean(response); },
		/** 状态码 */
		get status() { return status; },
		set status(v) { if (response) { return; } status = v; },
		get location() { return resHeaders['location'] || ''; },
		set location(url) { if (!response) { resHeaders['location'] = url; } },
		/** 相应头中的 contentType */
		get responseType() { return resHeaders['content-type'] || ''; },
		set responseType(v) {
			if (!response) { resHeaders['content-type'] = v; }
		},
		/**
		 * 获取已设置的 cookie 信息
		 */
		getCookie(name?: string) { return getCookie(sentCookies, name); },
		/**
		 * 设置 cookie
		 * @param name cookie 名称
		 * @param value cookie 内容
		 * @param option 选项
		 */
		setCookie(
			name,
			value,
			{ expire, domain, path, secure, httpOnly } = {},
		) {
			if (response) { return; }
			sentCookies.push({
				name, value, expire, domain, path, secure, httpOnly,
			});
			resHeaders['set-cookie'] = getCookieHeader(sentCookies);
		},
		clearCookie(
			name?: string | CookieClearOption,
			opt?: CookieClearOption | boolean,
		): void {
			if (response) { return; }
			clearCookie(sentCookies, cookies, name, opt);
			resHeaders['set-cookie'] = getCookieHeader(sentCookies);
		},

		hasHeader(n) { return n in resHeaders; },
		getHeaderNames() { return Object.keys(resHeaders); },
		getHeaders() { return {...resHeaders}; },
		getHeader(n) { return resHeaders[n]; },
		setHeader(n, v) {
			if (response) { return; }
			if (v === undefined) {
				delete resHeaders[n];
			} else {
				resHeaders[n] = v;
			}
		},
		write(chunk: WriteType): Promise<boolean> {
			send();
			return writable.write(chunk);
		},
	};
	Promise.race([
		abortPromise.finally(() => abortResponse),
		main(app, context, router, handlers),
	]).finally(() => {
		destroyed = true;
		let promise: Promise<void> = Promise.resolve();
		for (const [service, state] of [...services.entries()]) {
			promise = promise.then(() => service(Object.create(context, {
				channel: {value: 'destroy'},
				state: {value: state},
			}))).catch(e => app.log.error(e));
		}
		return promise.then(send).then(() => writable.end());
	});

	return new Promise<K99Response>(r => {
		if (response) { r(response); } else { resolve = r; }
	});
}
function destroyServices(app: App, guards: Map<Guard<any, any, any>, object>) {
	let promise: Promise<void> = Promise.resolve();
	for (const [guard, state] of [...guards.entries()]) {
		promise = promise
			.then(() => guard({ channel: 'clear', state }))
			.catch(e => app.log.error(e));
	}
	return promise.then(() => null);
}
export default function callback(
	app: App,
	request: K99Request,
	parent?: Context,
): Promise<null | K99Response> {
	const { aborted, method, pathname } = request;
	const guards = new Map<Guard<any, any, any>, object>();
	const abortPromise: Promise<null> = aborted
		? aborted.then(e => Promise.reject(e))
		: new Promise(() =>{});
	const findPromise = find(app, method, pathname, guards, {}, '', 0);

	return Promise.race([abortPromise, findPromise]).then(it => {
		if (!it) { return destroyServices(app, guards); }
		const {router, handlers, params} = it;
		return run(
			app,
			request,
			guards,
			router,
			handlers,
			params,
			abortPromise,
			parent,
		);
	}, e => findPromise
		.then(() => destroyServices(app, guards))
		.then(() => Promise.reject(e)));
}
