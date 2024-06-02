import { Readable } from 'node:stream';
/**
 * 
 * @param {import('node:http').IncomingMessage | import('node:http2').Http2ServerRequest} req 
 * @returns {AbortSignal}
 */
function createAbortSignal(req) {
	const ac = new AbortController();
	/**
	 * 
	 * @param {Error} [err] 
	 * @returns 
	 */
	const end = (err) => {
		req.off('end', end);
		req.off('error', end);
		if (!err) { return; }
		ac.abort(err);
	};
	req.on('end', end);
	req.on('error', end);

	return ac.signal;
}

/**
 * 
 * @param {import('node:http').IncomingMessage | import('node:http2').Http2ServerRequest} req 
 * @returns {Request}
 */
export default function toWebRequest(req) {
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
	const body = ['GET', 'OPTIONS'].includes(method) ? null : /** @type {any} */(Readable.toWeb(req));
	// @ts-ignore
	return new Request(url, { method, headers, signal, body, duplex: 'half'});
}
