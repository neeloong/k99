import type WriteType from './WriteType';
import { Context } from './context';

export default interface ActionContext extends Context {
	/** 输出是否已经因为各种原因结束 */
	readonly finished: boolean;
	/** 将数据写入相应 */
	write(chunk: WriteType): Promise<boolean>;
}
