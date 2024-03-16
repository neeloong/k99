import type { ServerResponse, IncomingMessage } from 'node:http';
import type { Http2ServerRequest } from 'node:http2';
import { Http2ServerResponse } from 'node:http2';
import type { Writable } from 'node:stream';
import toWebRequest from './toWebRequest';
import linkResponse from './linkResponse';

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
		return run(toWebRequest(req)).then(r => {
			if (r) { return linkResponse(res, r, onError); }
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
