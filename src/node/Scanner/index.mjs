import { setRegister } from './register';
import scan from './scan';

/**
 * @typedef {object} Scanner.FileItem
 * @property {string} extname 扩展名
 * @property {string} type 类型
 * @property {string} root 扫描根路径
 * @property {string} path 相对于扫描根路径的路径
 * @property {string[]} scope 范围 根据目录层次处理后的相对路径，不含扩展名及类型，且不含文件名 index
 * @property {string} [plugin] 扩展名
 */
/**
 * @callback Scanner.RegisterFn
 * 注册函数
 * @param file 要注册的文件的信息
 * @param opt 注册选项
 * @param router 当前的路由
 * @returns {boolean | Promise<boolean>}
 */

/**
 * @typedef {object} Scanner.Register
 * @property {string} extname 文件扩展名
 * @property {string} [type] 文件类型名
 * @property {Scanner.RegisterFn} register 注册函数
 */
class Scanner {
	/**
	 * 设置公共的文件注册器
	 * @param {Scanner.Register} register 注册配置
	 * @returns {boolean}
	 */
	static setRegister(register) {
		return setRegister(register);
	}
	/**
	 * 扫描指定路径，并将扫描到的文件进行注册
	 * @param {string} root    要扫描的路径
	 * @param {import('k99').ApiRouter} router  被注册的路由
	 * @returns {Promise<void>}
	 */
	static scan(root, router) {
		return scan(root, router);
	}
	/** @readonly @type {Record<string, Scanner.Register>} 注册器列表 */
	#registers = {};
	/**
	 * 扫描指定路径，并将扫描到的文件进行注册
	 * @param {string} root    要扫描的路径
	 * @param {import('k99').ApiRouter} router  被注册的路由
	 * @returns {Promise<void>}
	 */
	scan(root, router) {
		return scan(root, router, this.#registers);
	}
	/**
	 * 为当前路由设置注册器
	 * @param {Scanner.Register} register 
	 * @returns {boolean}
	 */
	setRegister(register) {
		return setRegister(register, this.#registers);
	}
}
export { Scanner };
