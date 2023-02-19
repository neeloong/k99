
import type K99Headers from '../types/K99Headers';
import type K99Request from '../types/K99Request';
import type Method from '../types/method';
import type WriteType from '../types/WriteType';
import str2bin from '../utils/str2bin';

function mergeArrayBuffer(data: Uint8Array[], length: number): Uint8Array {
	if (data.length === 1) { return new Uint8Array(data[0]); }
	const array = new Uint8Array(length);
	let offset = 0;
	for (const b of data) {
		array.set(b, offset);
		offset += b.byteLength;
	}
	return array;

}
function getBuffer(data: Uint8Array[], size?: number): Uint8Array {
	if (!size) {
		const ret = mergeArrayBuffer(data, data.reduce((a, b) => a + b.byteLength, 0));
		data.length = 0;
		return ret;
	}
	let length = 0;
	const list: Uint8Array[] = [];
	// eslint-disable-next-line no-cond-assign
	for (let it: Uint8Array | undefined; it = data.shift(); ) {
		if (length + it.byteLength > size) {
			const buffer = it.slice(0, size - length);
			list.push(buffer);
			length += buffer.byteLength;
			data.unshift(it.slice(buffer.byteLength));
			break;
		}
		list.push(it);
		length += it.byteLength;
		if (length === size) { break; }
	}
	return mergeArrayBuffer(list, length);
}

async function *toAsyncIterable(
	chunk?: WriteType
): AsyncIterable<Uint8Array> {
	if (!chunk) { return; }
	if (typeof chunk === 'string') { return yield str2bin(chunk); }
	if (typeof chunk !== 'object') { return; }
	if (chunk instanceof ArrayBuffer) { return yield  str2bin(chunk); }
	if (ArrayBuffer.isView(chunk)) { return yield  str2bin(chunk); }
	if (!(Symbol.asyncIterator in chunk || Symbol.iterator in chunk)) { return; }
	for await (const data of chunk) {
		yield *toAsyncIterable(data);
	}

}
type Item = [number, (v: Uint8Array | null) => void];

async function main(req: WriteType, getNext: () => Promise<Item>) {
	const data: Uint8Array[] = [];
	let length = 0;
	let [size, cb] = await getNext();
	for await (const buffer of toAsyncIterable(req)) {
		data.push(buffer);
		length += buffer.byteLength;
		if (size <= 0) {
			length = 0;
			cb(getBuffer(data));
			[size, cb] = await getNext();
			continue;
		}
		if (length >= size) {
			length -= size;
			cb(getBuffer(data, size));
			[size, cb] = await getNext();
		}
		while (length && (size <= 0 || size <= length)) {
			if (size <= 0) {
				length = 0;
				cb(getBuffer(data));
				[size, cb] = await getNext();
				break;
			}
			length -= size;
			cb(getBuffer(data, size));
			[size, cb] = await getNext();
		}
	}
	if (length) {
		cb(getBuffer(data));
		[size, cb] = await getNext();
	}
	cb(null);
	for (;;) {
		[size, cb] = await getNext();
		cb(null);
	}
}
function createRead(req?: WriteType) {
	if (!req) { return () =>Promise.resolve(null); }
	const list: Item[] = [];
	let next: null | ((v: Item) => void) = null;
	main(req, function getNext() {
		return new Promise<Item>(r => {
			const t = list.shift();
			if (t) { return r(t); }
			next = v => {
				next = null;
				r(v);
			};
		});
	});
	function read(size: number = 0): Promise<Uint8Array | null> {
		return new Promise(resolve => {
			size = Math.max(size, 0);
			if (next) {
				next([size, resolve]);
				return;
			}
			list.push([size, resolve]);
		});
	}
	return read;

}

const urlRegex = /^(?:(?:https?:)?\/\/(?:(?:[^/?#]*@)?)(?:\d+|(?:\[[0-9a-f:]+\])|(?:\d{1,3}\.){3}\d{1,3}|(?:(?:[a-z0-9\u0100-\uffff]+-*)+\.)+[a-z]+)(?::\d+)?)?((?:\/?[^?#]*)?)((?:\?[^#]*)?)(?:#.*)?$/i;


function getNameValue(s: string): [string, string] {
	const index = s.indexOf('=');
	if (index < 0) {
		return [decodeURIComponent(s), ''];
	}
	return [
		decodeURIComponent(s.substring(0, index)),
		decodeURIComponent(s.substring(index + 1)),
	];

}
function parseQuery(s: string): Record<string, string | string[]> {
	const query: Record<string, string | string[]> = {};
	for (const k of s.split('&').filter(Boolean)) {
		const [index, value] = getNameValue(k);
		if (index in query) {
			query[index] = [query[index], value].flat();
		} else {
			query[index] = [value];
		}
	}
	return query;
}
function parseUrl(uri: string): [string, string] {
	const result = urlRegex.exec(uri);
	if (!result) { return ['/', '']; }
	let [, pathname, search ] = result;
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
	{method, path, aborted, body, headers = {}}:{
		method: Method,
		path: string,
		body?: K99Request.Reader | WriteType,
		headers?: K99Headers,
		aborted?: Promise<void>,
	}
): K99Request {
	const [pathname, search] = parseUrl(path);
	return {
		method,
		url: `${ pathname }${ search }`,
		headers,
		pathname,
		search,
		aborted,
		query: parseQuery(search.substring(1)),
		read: typeof body === 'function' ? body : createRead(body),
	};
}
