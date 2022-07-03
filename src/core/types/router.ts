import Router from '../Router';
import { Handler } from './handle';

export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD';

export interface Match {
	(pathname: string): null | [string, Record<string, any>];
}
export interface Route {
	/** 请求路径 */
	path: string;
	/** 路径匹配 */
	match: Match;

	/** 所属插件 */
	plugin?: string;

	router?: null;

	/** 处理函数 */
	handlers: Handler[]
	/** 方法列表 */
	methods: Set<Method>;
}
export interface RouterRoute {
	/** 请求路径 */
	path: string;
	/** 路径匹配 */
	match: Match;

	router: Router;
}
