import type { ServerResponse, IncomingMessage } from 'node:http';
import type { Http2ServerRequest } from 'node:http2';
import { Http2ServerResponse } from 'node:http2';
import type { Readable } from 'node:stream';

function createReadableStream(req: Readable) {
	let cb: null | ((v: Uint8Array | null) => void) = null;
	let ended = false;
	function end() {
		if (ended) { return; }
		ended = true;
		if (!cb) { return; }
		const resolve = cb;
		cb = null;
		resolve(null);

	}
	req.addListener('end', end);
	req.addListener('readable', () => {
		if (!cb) { return; }
		const value = req.read();
		const data = typeof value === 'string' ? Buffer.from(value) : value;
		const resolve = cb;
		cb = null;
		resolve(data || null);
	});
	return new ReadableStream<Uint8Array>({
		async pull(controller) {
			if (ended) { return controller.close(); }
			const value = req.read();
			const data = typeof value === 'string' ? Buffer.from(value) : value;
			if (data) { return controller.enqueue(data); }
			cb = value => {
				if (!value) {
					controller.close();
				} else {
					controller.enqueue(value);
				}
			};
		},
		async cancel(r) {
			end();
			req.destroy(r);
		},
	});
}
function createAbortSignal(req: IncomingMessage | Http2ServerRequest) {
	const ac = new AbortController();
	const end = (err?: Error) => {
		req.off('end', end);
		req.off('error', end);
		if (!err) { return; }
		ac.abort(err);
	};
	req.on('end', end);
	req.on('error', end);

	return ac.signal;
}


function createRequest(
	req: IncomingMessage | Http2ServerRequest,
): Request {
	const signal = createAbortSignal(req);

	// TODO: url
	const url = req.url || '/';
	const method = (req.method || 'GET').toUpperCase();
	const headers = new Headers();
	for (const [k, v] of Object.entries(req.headers)) {
		for (const it of [v].flat()) {
			headers.append(k.toLowerCase(), String(it));
		}
	}
	const body = ['GET', 'OPTIONS'].includes(method) ? null : createReadableStream(req);
	return new Request(url, { method, headers, signal, body });
}


async function sendResponse(
	res: ServerResponse | Http2ServerResponse,
	target: Response,
	onError: (e: any) => void,
	errorInResponse?: boolean,
) {
	res.statusCode = target.status;
	for (const [k, v] of Object.entries(target.headers)) {
		if (v !== undefined) {
			res.setHeader(k, v);
		}
	}
	const stream = res instanceof Http2ServerResponse ? res.stream : res;
	let sent = false;
	try {
		const {body} = target;
		if (body) {
			sent = true;
			// TODO:
			stream.write(body);
		}
	} catch (e) {
		if (errorInResponse && !sent) {
			if (e instanceof Error) {
				stream.write(`${ e.stack || '' }`);
			} else {
				stream.write(String(e));
			}
		}
		onError(e);
	} finally {
		res.end();
	}
}
function echoError(e: any) {
	console.error(e);
}
interface HttpCallbackOptions<
	TReq extends IncomingMessage | Http2ServerRequest,
	TRes extends ServerResponse | Http2ServerResponse,
> {
	notFound?(req: TReq, res: TRes, next?: () => void): any;
	onError?(e: any): void;
	errorInResponse?: boolean;
}
export default function createHttpCallback<
	TReq extends IncomingMessage | Http2ServerRequest,
	TRes extends ServerResponse | Http2ServerResponse,
>(
	run: (request: Request) => Promise<Response | null>,
	{
		notFound,
		onError = echoError,
		errorInResponse,
	}: HttpCallbackOptions<TReq, TRes> = {}
): (req: TReq, res: TRes, next?: () => void) => any {
	return async function httpCallback(req, res, next) {
		const r = await run(createRequest(req)).then(r => {
			if (r) { return sendResponse(res, r, onError, errorInResponse); }
			if (notFound) { return notFound(req, res, next); }
			if (next) { return next(); }
			res.statusCode = 404;
			res.end();
		}, () => {
			res.statusCode = 500;
			res.end();
		});
	};
}
