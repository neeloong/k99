/** @import { IncomingMessage, ServerResponse } from 'node:http' */
/** @import { Http2ServerRequest, Http2ServerResponse } from 'node:http2' */
import { Readable } from 'node:stream';
/**
 * 
 * @param {IncomingMessage | Http2ServerRequest} req 
 * @param {ServerResponse | Http2ServerResponse} [res] 
 * @returns {AbortSignal}
 */
function createAbortSignal(req, res) {
	const ac = new AbortController();
	/**
	 * 
	 * @param {Error} [err] 
	 * @returns 
	 */
	const end = (err) => {
		res?.off('close', end);
		req.off('error', end);
		ac.abort(err);
	};
	res?.on('close', end);
	req.on('error', end);

	return ac.signal;
}

/**
 * 
 * @param {IncomingMessage | Http2ServerRequest} req 
 * @param {AbortSignal | ServerResponse | Http2ServerResponse} [signalOrRes] 
 * @returns {Request}
 */
export default function toWebRequest(req, signalOrRes) {
	const signal = signalOrRes instanceof AbortSignal
		? signalOrRes
		: createAbortSignal(req, signalOrRes);
	const host = req.headers['host'] || '127.0.0.1';
	const url = new URL(req.url || '/', `http://${ host }`);
	const method = (req.method || 'GET').toUpperCase();
	const headers = new Headers();
	for (const [k, v] of Object.entries(req.headers)) {
		for (const it of [v].flat()) {
			headers.append(k.toLowerCase(), String(it));
		}
	}
	const body = ['GET', 'OPTIONS'].includes(method) ? null : /** @type {any} */(Readable.toWeb(req));
	// @ts-ignore
	return new Request(url, { method, headers, signal, body, duplex: 'half'});
}
