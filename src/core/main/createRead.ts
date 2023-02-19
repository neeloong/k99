import type Encoding from '../types/Encoding';
import type HexEncoding from '../types/HexEncoding';
import bin2str from '../utils/bin2str';

export default function createRead(
	get: (size?: number) => Promise<Uint8Array | null>
) {
	let readPromise = Promise.resolve(false);
	function read(size?: number, encoding?: null): Promise<Uint8Array | null>;
	function read(size: number, encoding: Encoding | HexEncoding): Promise<string | null>;
	function read(size?: number, encoding?: Encoding | HexEncoding | null): Promise<string | Uint8Array | null>;
	function read(
		size: number = 0,
		encoding?: Encoding | HexEncoding | null
	): Promise<string | Uint8Array | null> {
		const promise = readPromise.then(v => {
			if (v) { return null; }
			return get(size);
		});
		readPromise = promise.then(v => !v);
		return promise.then(value => bin2str(value, encoding));
	}
	return read;
}
