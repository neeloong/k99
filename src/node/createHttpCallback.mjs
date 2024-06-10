import { Http2ServerResponse } from 'node:http2';
import toWebRequest from './toWebRequest.mjs';
import linkResponse from './linkResponse.mjs';

/**
 * 
 * @param {any} e 
 */
function echoError(e) {
	console.error(e);
}
/**
 * @template {import('node:http').IncomingMessage | import('node:http2').Http2ServerRequest} TReq
 * @template {import('node:http').ServerResponse | import('node:http2').Http2ServerResponse} TRes
 * @typedef {object} HttpCallbackOptions
 * @property {(req: TReq, res: TRes, next?: () => void) => any} [notFound]
 * @property {(e: any) => void} [onError]
 * @property {boolean} [errorInResponse]
 */
/**
 * 
 * @template {import('node:http').IncomingMessage | import('node:http2').Http2ServerRequest} TReq
 * @template {import('node:http').ServerResponse | import('node:http2').Http2ServerResponse} TRes
 * @param {(request: Request) => Promise<Response | null>} run 
 * @param {HttpCallbackOptions<TReq, TRes>} [options] 
 * @returns {(req: TReq, res: TRes, next?: () => void) => any}
 */
export default function createHttpCallback(run, {
		notFound,
		onError = echoError,
		errorInResponse,
	} = {}) {
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
			/** @type {import('node:stream').Writable} */
			const stream =
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
