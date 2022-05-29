import type { Router } from 'k99';
import { setRegister } from './register';
import scan from './scan';

class Scanner {
	/**
	 * 设置公共的文件注册器
	 * @param register 注册配置
	 */
	static setRegister(register: Scanner.Register): boolean {
		return setRegister(register);
	}
	/**
	 * 扫描指定路径，并将扫描到的文件进行注册
	 * @param root    要扫描的路径
	 * @param router  被注册的路由
	 */
	static scan(root: string, router: Router): Promise<void> {
		return scan(root, router);
	}
	/** 注册器列表 */
	private readonly __registers: Record<string, Scanner.Register> = {};
	/**
	 * 扫描指定路径，并将扫描到的文件进行注册
	 * @param root    要扫描的路径
	 * @param router  被注册的路由
	 */
	scan(root: string, router: Router): Promise<void> {
		return scan(root, router, this.__registers);
	}
	/** 为当前路由设置注册器 */
	setRegister(register: Scanner.Register): boolean {
		return setRegister(register, this.__registers);
	}
}
declare namespace Scanner {
	export interface FileItem {
		/** 扩展名 */
		extname: string;
		/** 类型 */
		type: string;
		/** 扫描根路径 */
		root: string;
		/** 相对于扫描根路径的路径 */
		path: string;
		/** 范围 根据目录层次处理后的相对路径，不含扩展名及类型，且不含文件名 index */
		scope: string[];
		plugin?: string;
	}

	export interface Register {
		/** 文件扩展名 */
		extname: string;
		/** 文件类型名 */
		type?: string;
		/**
	 * 注册函数
	 * @param file 要注册的文件的信息
	 * @param opt 注册选项
	 * @param router 当前的路由
	 */
		register(file: FileItem, router: Router): boolean | Promise<boolean>;
	}

}
export default Scanner;
