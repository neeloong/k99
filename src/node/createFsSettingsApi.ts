import * as fsPromises from 'node:fs/promises';
import * as pathFn from 'node:path';
import type { Environment } from 'k99/environment';

export default function createFsSettingsApi(
	...settingsPath: string[]
): Environment.Setting.Api {
	const basePath = pathFn.resolve(...settingsPath, '.');
	return {
		async read(path: string) {
			const p = `${ basePath }/${ path }.json`;
			const text = await fsPromises.readFile(p, 'utf8').catch(() => '');
			if (!text) { return undefined; }
			try {
				return JSON.parse(text);
			} catch {}
		},
		async write(path: string, cfg?: object | null | undefined) {
			const p = `${ basePath }/${ path }.json`;
			if (cfg === undefined) {
				return fsPromises.unlink(p).then(() => true, () => false);
			}
			await fsPromises.mkdir(pathFn.dirname(p), { recursive: true }).catch(() => {});
			const text = JSON.stringify(cfg);
			return fsPromises.writeFile(p, text).then(() => true, () => false);
		},
	};
}
