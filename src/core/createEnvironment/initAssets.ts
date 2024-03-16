import type { Environment } from './Environment';
import bin2str from './bin2str';
import str2bin from './str2bin';


async function defaultRead() { return null; }
async function defaultWrite() { return false; }

export default function initAssets(
	{
		read = defaultRead,
		write = defaultWrite,
		delete: unlink = defaultWrite,
		stat = defaultRead,
	}: Environment.Asset.Api = {},
): Environment.Asset {
	async function readAsset(
		path: string,
		encoding?: null,
	): Promise<Uint8Array | null>;
	async function readAsset(
		path: string,
		encoding: Environment.Encoding | Environment.HexEncoding,
	): Promise<string | null>;
	async function readAsset(
		path: string,
		encoding?: Environment.Encoding | Environment.HexEncoding | null,
	): Promise<string | Uint8Array | null>;
	async function readAsset(
		path: string,
		encoding?: Environment.Encoding | Environment.HexEncoding | null,
	): Promise<Uint8Array | string | null> {
		const ret = await read(path);
		return ret && bin2str(ret, encoding);
	}
	async function writeAsset(
		path: string,
		data?: string | ArrayBuffer | ArrayBuffer | ArrayBufferView | null,
		encoding?: Environment.Encoding | Environment.HexEncoding
	) {
		if (data === undefined) { return unlink(path); }
		const value = str2bin(data, encoding);
		if (!value) { return unlink(path); }
		return write(path, value);
	}
	function deleteAsset(path: string) {
		return unlink(path);
	}

	async function statAsset(path: string): Promise<Environment.Asset.Stats | null> {
		return stat(path);
	}
	return {
		read: readAsset,
		write: writeAsset,
		delete: deleteAsset,
		stat: statAsset,
	};
}
