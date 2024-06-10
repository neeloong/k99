import * as fsPromises from 'node:fs/promises';
import * as pathFn from 'node:path';

/**
 * 
 * @param  {...string} assetsPath 
 * @returns {import('k99/environment').Asset.Api}
 */
export default function createFsAssetsApi(
	...assetsPath
) {
	const basePath = pathFn.resolve(...assetsPath, '.');
	return {
		/**
		 * 
		 * @param {string} path 
		 * @returns {Promise<Uint8Array?>}
		 */
		async read(path) {
			const p = `${ basePath }/${ path }`;
			try {
				const data = await fsPromises.readFile(p);
				return data;
			} catch {
				return null;
			}
		},
		/**
		 * 
		 * @param {string} path 
		 * @param {any} data 
		 * @returns {Promise<boolean>}
		 */
		async write(path, data) {
			const p = `${ basePath }/${ path }`;
			await fsPromises.mkdir(pathFn.dirname(p), { recursive: true }).catch(e => {});
			return fsPromises.writeFile(p, data).then(() => true, () => false);
		},
		/**
		 * 
		 * @param {string} path 
		 * @returns {Promise<boolean>}
		 */
		delete(path) {
			const p = `${ basePath }/${ path }`;
			return fsPromises.unlink(p).then(() => true, () => false);
		},
		/**
		 * 
		 * @param {string} path 
		 * @returns {Promise<import('k99/environment').Asset.Stats?>}
		 */
		async stat(path) {
			const p = `${ basePath }/${ path }`;
			try {
				const s = await fsPromises.stat(p);
				return {
					get isDirectory() { return s.isDirectory(); },
					size: s.size,
					updateTime: s.mtime,
					createTime: s.birthtime,
				};
			} catch {
				return null;
			}
		},
	};
}
