import * as http from 'node:http';
import {start, createHttpCallback} from 'k99/node';
import opt, {List as OptList} from '../opt';

export async function exec({
	path,
	listen,
	port = 8080,
	bind,
}: opt, ...args: string[]) {
	if (path) {
		process.chdir(path);
	}
	const r = await start();
	console.log('K99', '@');
	const server = http.createServer(createHttpCallback(r));
	// (global as any).router = router;
	if (listen && typeof listen === 'string') {
		server.listen(listen);
		console.log('K99', '>', listen);
	} else {
		server.listen(port, bind);
		console.log('K99', '>', `${ bind || '0.0.0.0' }:${ port }`);
	}
}

export const opts: OptList[] = [
	'path',
	'listen',
	'port',
	'bind',
];
export const argv = '';
export const explain = '启动服务器';
export async function help(...argv: string[]) {}
