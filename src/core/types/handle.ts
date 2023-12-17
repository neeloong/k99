import type { Context } from './context';

export type HandlerResult =
	| void
	| undefined
	| string
	| BufferSource
	| ArrayBufferView
	| AsyncIterable<string | BufferSource | ArrayBufferView>
	| Iterable<string | BufferSource | ArrayBufferView>
	| object
	| Response
	| ReadableStream
	| Blob
	| FormData
	| boolean;

/** 处理函数定义 */
export interface Handler {
	(ctx: Context): PromiseLike<HandlerResult> | HandlerResult;
	/** 所属组 */
	plugin?: string;
}
