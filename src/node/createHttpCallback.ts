import type { ServerResponse, IncomingMessage } from 'node:http';
import type { Http2ServerRequest } from 'node:http2';
import { Http2ServerResponse } from 'node:http2';
import type { Writable } from 'node:stream';
import { Readable } from 'node:stream';

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
	const host = req.headers['host'] || '127.0.0.1';
	const url = new URL(req.url || '/', `http://${ host }`);
	const method = (req.method || 'GET').toUpperCase();
	const headers = new Headers();
	for (const [k, v] of Object.entries(req.headers)) {
		for (const it of [v].flat()) {
			headers.append(k.toLowerCase(), String(it));
		}
	}
	const body = ['GET', 'OPTIONS'].includes(method) ? null : Readable.toWeb(req) as any;
	// @ts-ignore
	return new Request(url, { method, headers, signal, body, duplex: 'half'});
}


async function sendResponse(
	res: ServerResponse | Http2ServerResponse,
	response: Response,
	onError: (e: any) => void,
) {
	res.statusCode = response.status;
	const {headers} = response;
	for (const [k, v] of headers) {
		res.setHeader(k, v);
	}
	const cookies = headers.getSetCookie();
	if (cookies.length) {
		res.setHeader('set-cookie', cookies);
	}
	const {body} = response;
	if (!body) {
		res.end();
		return;
	}
	const readable = Readable.fromWeb(body as any);
	readable.on('error', onError);
	readable.pipe(res instanceof Http2ServerResponse ? res.stream : res);
}
function echoError(e: any) {
	console.error(e);
}
export interface HttpCallbackOptions<
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
	return function httpCallback(req, res, next) {
		return run(createRequest(req)).then(r => {
			if (r) { return sendResponse(res, r, onError); }
			if (notFound) { return notFound(req, res, next); }
			if (next) { return next(); }
			res.statusCode = 404;
			res.end();
		}, e => {
			res.statusCode = 500;
			onError(e);
			if (!errorInResponse) {
				res.end();
				return;
			}
			const stream: Writable =
					res instanceof Http2ServerResponse ? res.stream : res;
			if (e instanceof Error) {
				stream.write(`${ e.stack || '' }`);
			} else {
				stream.write(String(e));
			}
			res.end();
		});
	};
}
