
export interface Log {
	(): string;
	(path: string): this;
	(path: string, mark: true): this;

	/** 读取日志 */
	read(path: string): Promise<string>;
	/** 写入日志 */
	write(path: string, log: string, opt?: Log.Options): Promise<boolean>;
	/** 清除日志 */
	clear(path: string): Promise<void>;

	/** 输出信息日志 */
	debug(log: string, opt?: Log.Options): Promise<boolean>;
	/** 输出信息日志 */
	info(log: string, opt?: Log.Options): Promise<boolean>;
	/** 输出警告日志 */
	warn(log: any, opt?: Log.Options): Promise<boolean>;
	/** 输出错误日志 */
	error(log: any, opt?: Log.Options): Promise<boolean>;
}
export declare namespace Log {
	export interface Options {
		/** 是否添加时间标签 */
		date?: boolean;
		/** 在日志前添加的标签 */
		tags?: string | string[];
		/** 多行日志的缩进字符串，或者是缩进空格的数量 */
		indent?: string | number;
	}
	export interface Api {
		/** 读取日志 */
		read?(path: string): Promise<string>;
		/** 写入日志 */
		write?(path: string, log: string): Promise<boolean>;
		/** 清除日志 */
		clear?(path: string): Promise<void>;
	}
}
