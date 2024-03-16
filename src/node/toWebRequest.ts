import type { IncomingMessage } from 'node:http';
import type { Http2ServerRequest } from 'node:http2';
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


export default function toWebRequest(
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
