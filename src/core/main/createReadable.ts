import type WriteType from '../types/WriteType';
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

export default function createReadable(v: any) {
	const iterator = toAsyncIterable(v);
	return new ReadableStream({
		async pull(controller) {
			const { value, done } = await iterator.next();
			if (done) {
			  controller.close();
			} else {
			  controller.enqueue(value);
			}
		},
		cancel(reason) {
			iterator.throw(reason);
		},
		type: 'bytes',
	});
}
