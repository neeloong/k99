
import type { K99Headers } from '../types/K99Headers';
import type { Method } from '../types/method';
import type { WriteType } from '../types/WriteType';
import str2bin from '../utils/str2bin';


async function *toAsyncIterable(
	chunk?: WriteType
): AsyncGenerator<Uint8Array> {
	if (!chunk) { return; }
	if (typeof chunk === 'string') { return yield str2bin(chunk); }
	if (typeof chunk !== 'object') { return; }
	if (chunk instanceof ArrayBuffer) { return yield str2bin(chunk); }
	if (ArrayBuffer.isView(chunk)) { return yield str2bin(chunk); }
	if (!(Symbol.asyncIterator in chunk || Symbol.iterator in chunk)) { return; }
	for await (const data of chunk) {
		yield *toAsyncIterable(data);
	}
}
function createRead(chunk?: WriteType) {
	if (!chunk) { return null; }
	if (typeof chunk === 'string') { return str2bin(chunk); }
	if (typeof chunk !== 'object') { return null; }
	if (chunk instanceof ReadableStream) { return chunk; }
	if (chunk instanceof ArrayBuffer) { return chunk; }
	if (ArrayBuffer.isView(chunk)) { return str2bin(chunk); }
	if (!(Symbol.asyncIterator in chunk || Symbol.iterator in chunk)) { return null; }

	const iter = toAsyncIterable(chunk);
	return new ReadableStream<Uint8Array>({
		async pull(controller) {
			const {value, done} = await iter.next();
			if (done) {
				controller.close();
			} else {
				controller.enqueue(value);
			}
		},
		async cancel() {
			await iter.return(0);
		},
	});


}


const urlRegex = /^(?:(?:https?:)?\/\/(?:(?:[^/?#]*@)?)(?:\d+|(?:\[[0-9a-f:]+\])|(?:\d{1,3}\.){3}\d{1,3}|(?:(?:[a-z0-9\u0100-\uffff]+-*)+\.)+[a-z]+)(?::\d+)?)?((?:\/?[^?#]*)?)((?:\?[^#]*)?)(?:#.*)?$/i;

function parseUrl(uri: string): [string, string] {
	const result = urlRegex.exec(uri);
	if (!result) { return ['/', '']; }
	let [, pathname, search] = result;
	const path: string[] = [];
	for (const p of pathname.replace(/^[\\/]+/, '').replace(/[\\/]+/g, '/').split('/')) {
		if (p === '.') { continue; }
		if (p === '..') {
			path.pop();
			continue;
		}
		path.push(p);
	}
	return [`/${ path.join('/') }`, search];
}

export default function createRequest(
	{ method: m, path, signal, body: data, headers: header = {} }: {
		method: Method,
		path: string,
		body?: WriteType,
		headers?: K99Headers,
		signal?: AbortSignal;
	}
): Request {
	const [pathname, search] = parseUrl(path);

	// TODO: url
	const url = `${ pathname }${ search }`;
	const method = (m || 'GET').toUpperCase();
	const headers = new Headers();
	for (const [k, v] of Object.entries(header)) {
		for (const it of [v].flat()) {
			headers.append(k.toLowerCase(), String(it));
		}
	}

	const body = !data || ['GET', 'OPTIONS'].includes(method) ? null : createRead(data);

	return new Request(url, {
		method,
		headers,
		signal,
		body,
	});
}
