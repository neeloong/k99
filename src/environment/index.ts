import initSettings from './initSettings.mjs';
import initAssets from './initAssets.mjs';
import initLog from './initLog.mjs';
export default function createEnvironment(options?: {
	setting?: Setting.Api;
	asset?: Asset.Api;
	log?: Log.Api;
	error?: (e: unknown) => void
}): Environment {
	const asset = initAssets(options?.asset);
	const setting = initSettings(options?.setting);
	const log = initLog(options?.log);
	return {
		asset,
		setting,
		log,
		error: options?.error || (e => { log.error(e); }),
	};
}
export interface Environment {
	readonly setting?: Setting;
	readonly asset?: Asset;
	readonly log?: Log;
	error?(error: unknown): void;
}

export type Encoding = 'utf8';
export type HexEncoding = 'base64' | 'hex';

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

export interface Log {
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

export interface Setting {
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

export namespace Environment {
	export type Encoding = 'utf8';
	export type HexEncoding = 'base64' | 'hex';

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

	export interface Log {
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

	export interface Setting {
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

}
