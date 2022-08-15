import Router from '../Router';
import { Handler } from './handle';

export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD' | 'OPTIONS';

export interface Pattern {
	name: string;
	optional: boolean;
	many: boolean;
	pattern: RegExp;
}
export type Match = (Pattern | string)[];
export interface Route {
	/** 路径匹配 */
	match: Match;

	router?: null;

	/** 所属插件 */
	plugin?: string;

	/** 处理函数 */
	handlers: Handler[]
	/** 方法列表 */
	methods: Set<Method>;
}
export interface RouterRoute {
	/** 路径匹配 */
	match: Match;

	router: Router;
}
