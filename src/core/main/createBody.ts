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
export default function createBody(chunk?: WriteType) {
	if (!chunk) { return null; }
	if (typeof chunk === 'string') { return chunk; }
	if (typeof chunk !== 'object') { return null; }
	if (chunk instanceof ReadableStream) { return chunk; }
	if (chunk instanceof ArrayBuffer) { return chunk; }
	if (ArrayBuffer.isView(chunk)) { return chunk; }
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
