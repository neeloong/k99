/**
 * 
 * @param {string} str 
 * @returns {Uint8Array}
 */
function str2utf8bin(str) {
	return new TextEncoder().encode(str);
}
/**
 * 
 * @param {unknown} chunk 
 * @returns {chunk is ArrayBuffer | SharedArrayBuffer}
 */
function isBufferSource(chunk) {
	if (chunk instanceof ArrayBuffer) { return true; }
	try {
		if (chunk instanceof SharedArrayBuffer) { return true; }
	} catch {

	}
	return false;
}
/**
 * 
 * @template T
 * @param {any} result 
 * @returns {result is Iterable<T> | AsyncIterable<T>}
 */
function isIterable(result) {
	return Symbol.asyncIterator in result || Symbol.iterator in result;

}
/**
 * 向可写流中写入数据
 * @param {WritableStreamDefaultWriter<Uint8Array>} writer 
 * @param {unknown} chunk 要写入的数据
 * @returns {Promise<void>}
 */
async function write(writer, chunk) {
	if (typeof chunk === 'string') {
		return writer.write(str2utf8bin(chunk));
	}
	if (typeof chunk !== 'object') { return; }
	if (ArrayBuffer.isView(chunk)) {
		return writer.write(new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength));
	}
	if (isBufferSource(chunk)) {
		return writer.write(new Uint8Array(chunk));
	}
	if (!isIterable(chunk)) {
		return;
	}
	for await (const data of chunk) {
		if (!data) { continue; }
		await write(writer, data);
	}
}

/**
 * 
 * @param {any} k 
 * @param {any} v 
 * @returns {any}
 */
function replacer(k, v) {
	if (typeof v === 'bigint') {
		return String(v);
	}
	return v;
}

/**
 * 
 * @param {any} result 
 * @param {Promise<never>} [aborted] 
 * @returns {[BodyInit, number, string] | null}
 */
function toBodyData(result, aborted) {
	if (result instanceof ReadableStream) {
		return [result, 0, ''];
	}
	if (result instanceof URLSearchParams) {
		return [result, 0, ''];
	}
	if (result instanceof Blob) {
		return [result, result.size, result.type];
	}
	if (result instanceof FormData) {
		return [result, 0, ''];
	}
	if (ArrayBuffer.isView(result) || isBufferSource(result)) {
		return [result, result.byteLength, ''];
	}
	if (typeof result === 'string') {
		const body = str2utf8bin(result);
		return [body, body.byteLength, ''];
	}
	if (typeof result !== 'object') {
		return null;
	}
	if (Array.isArray(result) || !isIterable(result)) {
		const body = str2utf8bin(JSON.stringify(result, replacer));
		return [body, body.byteLength, 'application/json'];
	}
	/** @type {TransformStream<Uint8Array, Uint8Array>} */
	const { writable, readable } = new TransformStream();
	const writer = writable.getWriter();
	aborted?.catch((e) => {
		writable.abort(e || new DOMException('The user aborted a request.')).catch(() => {});
	});
	(async () => {
		for await (const data of result) {
			if (!data) { continue; }
			await write(writer, data);
		}
		await writable.close();
	})().catch(() => {});
	return [readable, 0, ''];
}
/**
 * 
 * @param {any} result 
 * @param {Headers} headers 
 * @param {Promise<never>} [aborted] 
 * @returns 
 */
export default function toBody(result, headers, aborted) {
	const bodyData = toBodyData(result, aborted);
	if (!bodyData) { return null; }
	const [body, size, type] = bodyData;
	if (type && !headers.get('Content-Type')) {
		headers.set('Content-Type', type);
	}
	if (size > 0 && !headers.get('Content-Length')) {
		headers.set('Content-Length', String(size));
	}
	return body;
}
