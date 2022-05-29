import { Method } from './router';
import { K99Headers } from './K99Headers';

interface K99Request {
	readonly method: Method;
	readonly url: string;
	/** 请求路径 */
	readonly pathname: string;
	/** 查询字符串 */
	readonly search: string;
	/** 查询参数 */
	readonly query: Record<string, string | string[] | undefined>;

	readonly aborted?: Promise<void>,
	readonly headers: K99Headers;
	read(size?: number): Promise<Uint8Array | null>
}

declare namespace K99Request {
	export interface Reader {
		(size?: number): Promise<Uint8Array | null>;
	}
}
export { K99Request };
