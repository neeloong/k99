import type { Encoding } from './Encoding';
import type { HexEncoding } from './HexEncoding';

export interface Asset {

	/** 读取文件 */
	read(path: string, encoding?: null): Promise<Uint8Array | null>;
	read(path: string, encoding: Encoding | HexEncoding): Promise<string | null>;
	read(path: string, encoding?: Encoding | HexEncoding | null): Promise<string | Uint8Array | null>;
	/** 删除文件 */
	delete(path: string): Promise<boolean>;
	/** 删除文件 */
	write(path: string, data?: null): Promise<boolean>;
	/** 写入文件 */
	write(path: string, data: string | ArrayBuffer | ArrayBuffer | ArrayBufferView, encoding?: Encoding | HexEncoding): Promise<boolean>;
	/** 获取文件信息 */
	stat(path: string): Promise<Asset.Stats | null>;
}
export declare namespace Asset {
	export interface Stats {
		isDirectory: boolean;
		size: number;
		updateTime: Date;
		createTime: Date;
	}

	export interface Api {
		/** 读取文件 */
		read?(path: string): Promise<Uint8Array | null>;
		/** 删除文件 */
		delete?(path: string): Promise<boolean>;
		/** 写入文件 */
		write?(path: string, data: Uint8Array): Promise<boolean>;
		/** 获取文件信息 */
		stat?(path: string): Promise<Stats | null>;
	}
}
