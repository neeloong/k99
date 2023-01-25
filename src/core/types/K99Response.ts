import type K99Headers from './K99Headers';

export default interface K99Response {
	status: number;
	finished: boolean;
	headers: K99Headers;
	next(): Promise<IteratorResult<Uint8Array, void>>;
	return<T>(value: T | PromiseLike<T>): Promise<IteratorResult<Uint8Array, T>>;
	throw(e: any): Promise<IteratorResult<Uint8Array, void>>;
	[Symbol.asyncIterator](): AsyncGenerator<Uint8Array>;
}
