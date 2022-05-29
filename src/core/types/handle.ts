import { MaybePromise } from './promise';
import { Context } from './context';
import { WriteType } from './writeType';


/** 处理函数定义 */
interface Handler {
	(ctx: Context): MaybePromise<void | undefined | WriteType | object | boolean>;
	/** 所属组 */
	plugin?: string;
}
export { Handler };
