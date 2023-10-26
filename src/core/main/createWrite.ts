import type { WriteType } from '../types/WriteType';
import str2bin from '../utils/str2bin';

type Item = [Uint8Array | undefined, ((v: boolean) => void)];

export interface Writable {
	write(chunk: WriteType): Promise<boolean>
	end(): Promise<void>
	readonly ended: boolean
}

export function isBaseWriteType(
	chunk: object
): chunk is ArrayBuffer | ArrayBufferView {
	if (chunk instanceof ArrayBuffer) { return true; }
	if (ArrayBuffer.isView(chunk)) { return true; }
	return false;
}

export default function createWrite(): [
	Writable,
	AsyncGenerator<Uint8Array, any, unknown>,
	(e?: any) => boolean
] {
	let finished = false;

	let list: Item[] = [];
	let next: null | ((data: Item) => void) = null;

	function done(callback?: ((v: boolean) => void) | null) {
		if (finished) { return null; }
		finished = true;
		if (callback) { callback(false); }
		// eslint-disable-next-line no-cond-assign
		for (let value; value = list.shift();) {
			const [, cb] = value;
			cb(false);
		}
		return null;
	}
	let nextPromise: Promise<((v: boolean) => void) | null> = Promise.resolve(() => { });
	const readable: AsyncGenerator<Uint8Array> = {
		next() {
			const promise = nextPromise.then(cb => {
				if (!cb) { return; }
				if (abortException) {
					cb(false);
					return abortedPromise;
				}
				cb(true);

				return Promise.race([abortedPromise, new Promise<Item>(r => {
					const value = list.shift();
					if (value) { return r(value); }
					next = value => {
						next = null;
						r(value);
					};
				}).then<Item | void>(value => {
					const [data, cb] = value;
					if (!abortException && data !== undefined) { return value; }
					cb(!abortException);
				})]);
			});
			nextPromise = promise.then(value => {
				if (!value) { return null; }
				const [, cb] = value;
				return cb;
			}, () => done());
			return promise.then(value => {
				if (!value) { return { done: true, value: undefined }; }
				const [data, cb] = value;
				return { done: false, value: data } as IteratorYieldResult<Uint8Array>;
			});
		},
		throw(e: any) {
			nextPromise = nextPromise.then(done);
			return nextPromise.then(() => Promise.reject(e));
		},
		return(r: any) {
			nextPromise = nextPromise.then(done);
			return nextPromise.then(() => r);
		},
		[Symbol.asyncIterator]() { return readable; },
	};
	let abortException: any;
	let abortReject: ((any?: any) => void) | undefined;
	let abortedPromise = new Promise<void>((_, reject) => {
		if (abortException) {
			reject(abortException);
		} else {
			abortReject = reject;
		}
	});
	abortedPromise.then(null, () => {});
	function abort(e?: any) {
		if (abortException) { return false; }
		abortException = e || new DOMException('The user aborted a request.');
		if (abortReject) { abortReject(abortException); }
		return true;

	}
	function run(chunk: Uint8Array, cb: (v: boolean) => void) {
		if (finished) { return cb(false); }
		if (!next) {
			list.push([chunk, cb]);
			return;
		}
		next([chunk, cb]);
	}

	let writePromise = Promise.resolve<boolean | void>(true);
	/**
	 * 向可写流中写入数据
	 * @param chunk 要写入的数据
	 */
	async function write(chunk: WriteType): Promise<boolean | void> {
		if (finished) { return Promise.resolve(); }
		if (typeof chunk === 'string') {
			return new Promise<boolean>(cb => run(str2bin(chunk), cb));
		}
		if (typeof chunk !== 'object') { return false; }
		if (isBaseWriteType(chunk)) {
			return new Promise<boolean>(cb => run(str2bin(chunk), cb));
		}
		if (!(Symbol.asyncIterator in chunk || Symbol.iterator in chunk)) {
			return false;
		}
		for await (const data of chunk) {
			if (finished) { return Promise.resolve(); }
			if (data && !await write(data)) { return false; }
		}
		return true;
	}
	let ended = false;
	const writable: Writable = {
		write(chunk: WriteType) {
			const promise = writePromise.then(v => {
				if (v === undefined) { return; }
				if (!chunk) { return true; }
				return write(chunk);
			});
			writePromise = promise;
			return promise.then(v => Boolean(v));
		},
		end() {
			ended = true;
			const promise = writePromise.then<void>(v => new Promise(cb => {
				if (v === undefined || finished) { return cb(); }
				if (!next) {
					list.push([undefined, () => cb()]);
					return;
				}
				next([undefined, () => cb()]);
			}));
			writePromise = promise;
			return promise;
		},
		get ended() {
			return finished || ended;
		},
	};
	return [writable, readable, abort];
}
