import ActionContext from './ActionContext';
import type WriteType from './WriteType';


/** 处理函数定义 */
export default interface Handler {
	(
		ctx: ActionContext
	): PromiseLike<void | undefined | WriteType | object | boolean>
	 | void | undefined | WriteType | object | boolean;
	/** 所属组 */
	plugin?: string;
}
