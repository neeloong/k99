import { Http2ServerResponse } from 'node:http2';
import { Readable } from 'node:stream';

/**
 * 
 * @param {import('node:http').ServerResponse | Http2ServerResponse} res 
 * @param {Response} response 
 * @param {(e: any) => void} onError 
 * @returns 
 */
export default async function linkResponse(res, response, onError) {
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
	const readable = Readable.fromWeb(/** @type {any} */(body));
	readable.on('error', onError);
	readable.pipe(res instanceof Http2ServerResponse ? res.stream : res);
}
