function str2utf8bin(str: string): Uint8Array {
	return new TextEncoder().encode(str);
}

function isBufferSource(chunk: unknown): chunk is ArrayBuffer | SharedArrayBuffer {
	if (chunk instanceof ArrayBuffer) { return true; }
	try {
		if (chunk instanceof SharedArrayBuffer) { return true; }
	} catch {

	}
	return false;
}

function isIterable<T>(result: any):result is Iterable<T> | AsyncIterable<T>  {
	return Symbol.asyncIterator in result || Symbol.iterator in result;

}
/**
 * 向可写流中写入数据
 * @param chunk 要写入的数据
 */
async function write(
	writer: WritableStreamDefaultWriter<Uint8Array>,
	chunk: unknown
): Promise<void> {
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


function replacer(k: any, v: any) {
	if (typeof v === 'bigint') {
		return String(v);
	}
	return v;
}

export default function toBodyData(
	result: any,
	aborted?: Promise<never>,
): [BodyInit, number, string] | null {
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
	if (Array.isArray(result) || !isIterable<unknown>(result)) {
		const body = str2utf8bin(JSON.stringify(result, replacer));
		return [body, body.byteLength, 'application/json'];
	}
	const { writable, readable } = new TransformStream<Uint8Array, Uint8Array>();
	const writer = writable.getWriter();
	aborted?.catch((e?: any) => {
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
