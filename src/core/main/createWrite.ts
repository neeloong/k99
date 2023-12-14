import type { WriteType } from '../types/WriteType';
import str2bin from '../utils/str2bin';

export interface Writable {
	write(chunk: WriteType): Promise<boolean>
	end(): Promise<void>
}
export function isBaseWriteType(
	chunk: object
): chunk is ArrayBuffer | ArrayBufferView {
	if (chunk instanceof ArrayBuffer) { return true; }
	if (ArrayBuffer.isView(chunk)) { return true; }
	return false;
}

export default function createWrite(
	writable: WritableStream<ArrayBufferView>
): Writable{
	const writer = writable.getWriter();
	let writePromise = Promise.resolve(false);
	/**
	 * 向可写流中写入数据
	 * @param chunk 要写入的数据
	 */
	async function write(chunk: WriteType): Promise<boolean> {
		if (typeof chunk === 'string') {
			await writer.write(str2bin(chunk));
			return true;
		}
		if (typeof chunk !== 'object') { return false; }
		if (isBaseWriteType(chunk)) {
			await writer.write(str2bin(chunk));
			return true;
		}
		if (!(Symbol.asyncIterator in chunk || Symbol.iterator in chunk)) {
			return false;
		}
		for await (const data of chunk) {
			if (data && !await write(data)) { return false; }
		}
		return true;
	}
	const writableData: Writable = {
		write(chunk: WriteType) {
			const p = writePromise.then(v => {
				if (v) { return [v, false ]; }
				return write(chunk).then(r => [v, v || !r ? false : true]);
			});
			writePromise = p.then(v => v[0]);
			return p.then(v => v[1]);
		},
		async end() {
			writePromise = writePromise.then(v => {
				if (v) { return true; }
				return writable.close().then(() => true);
			});
			return writePromise.then(() => {});
		},
	};

	return writableData;
}
