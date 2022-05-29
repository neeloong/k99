
export interface Setting {
	(): string;
	(path: string): this;
	(path: string, mark: true): this;

	/** 读取配置 */
	read(path: string): Promise<object | null | undefined>;
	/** 写入配置 */
	write(path: string, cfg?: object | null | undefined): Promise<boolean>;
	// todo: watch, unwatch
}
export declare namespace Setting {
	export interface Api {
		/** 读取配置 */
		read?(path: string): Promise<object | null | undefined>;
		/** 写入配置 */
		write?(path: string, cfg: object | null | undefined): Promise<boolean>;
	}
}
