
interface Setting {
	/** 读取配置 */
	read(path: string): Promise<object | null | undefined>;
	/** 写入配置 */
	write(path: string, cfg?: object | null | undefined): Promise<boolean>;
	// todo: watch, unwatch
}
declare namespace Setting {
	export interface Api {
		/** 读取配置 */
		read?(path: string): Promise<object | null | undefined>;
		/** 写入配置 */
		write?(path: string, cfg: object | null | undefined): Promise<boolean>;
	}
}
export default Setting;
