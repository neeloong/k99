import type { Context } from './context';
import type { WriteType } from './WriteType';


/** 处理函数定义 */
export interface Handler {
	(
		ctx: Context
	): PromiseLike<void | undefined | WriteType | object | boolean>
	| void | undefined | WriteType | object | boolean;
	/** 所属组 */
	plugin?: string;
}
