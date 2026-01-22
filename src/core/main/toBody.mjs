/**
 *
 * @param {string} str
 * @returns {Uint8Array<ArrayBuffer>}
 */
function str2utf8bin(str) {
	// @ts-ignore
	return new TextEncoder().encode(str);
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
	if (chunk instanceof ArrayBuffer) {
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
 * @param {any} result
 * @param {(this: any, key: string, value: any) => any} replacer
 * @param {Promise<never>} [aborted]
 * @returns {[BodyInit, number, string] | null}
 */
function toBodyData(result, replacer, aborted) {
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
	if (ArrayBuffer.isView(result) || result instanceof ArrayBuffer) {
		// @ts-ignore
		return [result, result.byteLength, ''];
	}
	if (typeof result === 'string') {
		const body = str2utf8bin(result);
		return [body, body.byteLength, 'text/plain'];
	}
	if (['bigint', 'boolean', 'number'].includes(typeof result)) {
		const body = str2utf8bin(JSON.stringify(result, replacer));
		return [body, body.byteLength, 'application/json'];
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
	aborted?.catch(e => {
		writable.abort(e || new DOMException('The user aborted a request.')).catch(() => {});
	});
	(async () => {
		for await (const data of result) {
			if (!data) { continue; }
			await write(writer, data);
		}
	})().then(() => writable.close(), r => writable.abort(r)).catch(() => {});
	return [readable, 0, ''];
}
/**
 *
 * @param {any} result
 * @param {Headers} headers
 * @param {(this: any, key: string, value: any) => any} replacer
 * @param {Promise<never>} [aborted]
 * @returns
 */
export default function toBody(result, headers, replacer, aborted) {
	const bodyData = toBodyData(result, replacer, aborted);
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
