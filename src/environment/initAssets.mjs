import bin2str from './bin2str.mjs';
import str2bin from './str2bin.mjs';


async function defaultRead() { return null; }
async function defaultWrite() { return false; }

/**
 * 
 * @param {import('./index.ts').Asset.Api} api 
 * @returns {import('./index.ts').Asset}
 */
export default function initAssets(
	{
		read = defaultRead,
		write = defaultWrite,
		delete: unlink = defaultWrite,
		stat = defaultRead,
	} = {},
) {
	/**
	 * @overload
	 * @param {string} path 
	 * @param {null} [encoding] 
	 * @returns {Promise<Uint8Array?>}
	 */
	/**
	 * @overload
	 * @param {string} path 
	 * @param {import('./index.ts').Encoding | import('./index.ts').HexEncoding} encoding 
	 * @returns {Promise<string?>}
	 */
	/**
	 * @overload
	 * @param {string} path 
	 * @param {import('./index.ts').Encoding | import('./index.ts').HexEncoding | null} [encoding] 
	 * @returns {Promise<string | Uint8Array | null>}
	 */
	/**
	 * 
	 * @param {string} path 
	 * @param {import('./index.ts').Encoding | import('./index.ts').HexEncoding | null} [encoding] 
	 * @returns {Promise<string | Uint8Array | null>}
	 */
	async function readAsset(path, encoding) {
		const ret = await read(path);
		return ret && bin2str(ret, encoding);
	}
	/**
	 * 
	 * @param {string} path 
	 * @param {string | ArrayBuffer | ArrayBuffer | ArrayBufferView | null} [data] 
	 * @param {import('./index.ts').Encoding | import('./index.ts').HexEncoding} [encoding] 
	 * @returns 
	 */
	async function writeAsset(path, data, encoding) {
		if (data === undefined) { return unlink(path); }
		const value = str2bin(data, encoding);
		if (!value) { return unlink(path); }
		return write(path, value);
	}
	/**
	 * 
	 * @param {string} path 
	 * @returns 
	 */
	function deleteAsset(path) {
		return unlink(path);
	}

	/**
	 * 
	 * @param {string} path 
	 * @returns {Promise<import('./index.ts').Asset.Stats?>}
	 */
	async function statAsset(path) {
		return stat(path);
	}
	return {
		read: readAsset,
		write: writeAsset,
		delete: deleteAsset,
		stat: statAsset,
	};
}
