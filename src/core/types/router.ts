import { Handler } from './handle';

export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD';

interface Match {
	(
		pathname: string,
		parent: string,
		key: number,
	): null | Match.Result;
	keyLen: number;
	isRoot?: boolean;
}
declare namespace Match {
	export interface Result {
		$path: string;
		[key: string]: any;
	}
}
export { Match };
export interface Route {
	/** 请求路径 */
	path: string;
	/** 路径匹配 */
	match: Match;

	/** 所属插件 */
	plugin?: string;

	/** 处理函数 */
	handlers: Handler[]
	/** 方法列表 */
	methods: Set<Method>;
}
