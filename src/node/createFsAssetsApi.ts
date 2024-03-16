import * as fsPromises from 'node:fs/promises';
import * as pathFn from 'node:path';
import type { Environment } from 'k99';

export default function createFsAssetsApi(
	...assetsPath: string[]
): Environment.Asset.Api {
	const basePath = pathFn.resolve(...assetsPath, '.');
	return {
		async read(path: string): Promise<Uint8Array | null> {
			const p = `${ basePath }/${ path }`;
			try {
				const data = await fsPromises.readFile(p);
				return data;
			} catch {
				return null;
			}
		},
		async write(path: string, data: any): Promise<boolean> {
			const p = `${ basePath }/${ path }`;
			await fsPromises.mkdir(pathFn.dirname(p), { recursive: true }).catch(e => {});
			return fsPromises.writeFile(p, data).then(() => true, () => false);
		},
		delete(path: string): Promise<boolean> {
			const p = `${ basePath }/${ path }`;
			return fsPromises.unlink(p).then(() => true, () => false);
		},
		async stat(path: string): Promise<Environment.Asset.Stats | null> {
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
