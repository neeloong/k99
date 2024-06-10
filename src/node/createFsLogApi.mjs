import * as fsPromises from 'node:fs/promises';
import * as pathFn from 'node:path';
/**
 * 
 * @param  {...string} logsPath 
 * @returns {import('k99/environment').Log.Api}
 */
export default function createFsLogApi(...logsPath) {
	const basePath = pathFn.resolve(...logsPath, '.');
	return {
		async read(path) {
			path = `${ basePath }/${ path }.log`;
			return fsPromises.readFile(path, 'utf-8').catch(() => '');
		},
		async write(path, log) {
			path = `${ basePath }/${ path }.log`;
			await fsPromises.mkdir(pathFn.dirname(path), { recursive: true }).catch(() => {});
			return fsPromises.appendFile(path, log).then(() => true, () => false);
		},
		async clear(path) {
			path = `${ basePath }/${ path }.log`;
			return fsPromises.writeFile(path, '').catch(() => {});
		},
	};
}
