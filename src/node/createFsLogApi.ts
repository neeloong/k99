import * as fsPromises from 'node:fs/promises';
import * as pathFn from 'node:path';
import type { Environment } from 'k99/environment';
export default function createFsLogApi(...logsPath: string[]): Environment.Log.Api {
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
		async clear(path): Promise<void> {
			path = `${ basePath }/${ path }.log`;
			return fsPromises.writeFile(path, '').catch(() => {});
		},
	};
}
