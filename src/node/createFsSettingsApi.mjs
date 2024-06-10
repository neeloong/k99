import * as fsPromises from 'node:fs/promises';
import * as pathFn from 'node:path';
/**
 * 
 * @param  {...string} settingsPath 
 * @returns {import('k99/environment').Setting.Api}
 */
export default function createFsSettingsApi(...settingsPath) {
	const basePath = pathFn.resolve(...settingsPath, '.');
	return {
		async read(path) {
			const p = `${ basePath }/${ path }.json`;
			const text = await fsPromises.readFile(p, 'utf8').catch(() => '');
			if (!text) { return undefined; }
			try {
				return JSON.parse(text);
			} catch {}
		},
		async write(path, cfg) {
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
