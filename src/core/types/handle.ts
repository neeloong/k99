import type { Context } from './context';
import type { WriteType } from './WriteType';

export type HandlerResult =
	| void
	| undefined
	| WriteType
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
