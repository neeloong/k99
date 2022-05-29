import { Asset, Encoding, HexEncoding } from '../types';
import Plugin from '../Plugin';
import getPluginPath from './getPluginPath';
import extendsInterface from './extendsInterface';
import bin2str from '../utils/bin2str';
import str2bin from '../utils/str2bin';
async function defaultRead() { return null; }
async function defaultWrite() { return false; }

export default function initAssets(
	{
		read = defaultRead,
		write = defaultWrite,
		delete: unlink = defaultWrite,
		stat = defaultRead,
	 }: Asset.Api = {},
	plugins: Record<string, Plugin>
): Asset {
	async function readAsset(
		path: string,
		encoding?: null,
	): Promise<Uint8Array | null>;
	async function readAsset(
		path: string,
		encoding: Encoding | HexEncoding,
	): Promise<string | null>;
	async function readAsset(
		path: string,
		encoding?: Encoding | HexEncoding | null,
	): Promise<string | Uint8Array | null>;
	async function readAsset(
		path: string,
		encoding?: Encoding | HexEncoding | null,
	): Promise<Uint8Array | string | null> {
		const ret = await read(path);
		if (ret !== null) { return bin2str(ret, encoding); }
		const p = getPluginPath(path, plugins);
		if (!p) { return null; }
		const [plugin, pluginPath] = p;
		return bin2str(await plugin.readAsset(pluginPath), encoding);
	}
	async function writeAsset(
		path: string,
		data?: string | ArrayBuffer | ArrayBuffer | ArrayBufferView | null,
		encoding?: Encoding | HexEncoding
	) {
		if (data === undefined) { return unlink(path); }
		const value = str2bin(data, encoding);
		if (!value) { return unlink(path); }
		return write(path, value);
	}
	function deleteAsset(path: string) {
		return unlink(path);
	}

	async function statAsset(path: string): Promise<Asset.Stats | null> {
		return stat(path);
	}
	return extendsInterface({
		read: readAsset,
		write: writeAsset,
		delete: deleteAsset,
		stat: statAsset,
	}, {});
}
