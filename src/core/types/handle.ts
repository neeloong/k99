import { MaybePromise } from './promise';
import { ActionContext } from './context';
import { WriteType } from './writeType';


/** 处理函数定义 */
interface Handler {
	(ctx: ActionContext): MaybePromise<void | undefined | WriteType | object | boolean>;
	/** 所属组 */
	plugin?: string;
}
export { Handler };
