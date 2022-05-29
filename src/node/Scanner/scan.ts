import * as fsPromise from 'node:fs/promises';
import * as pathFn from 'node:path';
import type {Router} from 'k99';
import type Scanner from '.';
import { register } from './register';


interface ValidInfo {
	filename: string;
	name: string;
	extname: string;
	type: string;

	no: number;
	tuple: boolean;
	extend: string;
}


function sort(a: ValidInfo, b: ValidInfo) {
	if (a.name && !b.name) { return 1; }
	if (!a.name && b.name) { return -1; }
	if (!a.name && !b.name) { return 0; }
	if (Number.isFinite(a.no) && Number.isFinite(b.no) && a.no !== b.no) {
		return a.no - b.no;
	}
	if (Number.isFinite(a.no) && !Number.isFinite(b.no)) { return -1; }
	if (!Number.isFinite(a.no) && Number.isFinite(b.no)) { return 1; }
	if (a.tuple && !b.tuple) { return 1; }
	if (!a.tuple && b.tuple) { return -1; }
	if (!a.extname && b.extname) { return 1; }
	if (a.extname && !b.extname) { return -1; }
	if (a.extend === b.extend) {
		let aName = a.name.toLowerCase();
		let bName = b.name.toLowerCase();
		return aName > bName ? 1
			: aName < bName ? -1
				: a.name < b.name ? 1
					: a.name > b.name ? -1
						: 0;
	}
	if (a.extend && !b.extend) { return 1; }
	if (!a.extend && b.extend) { return -1; }
	if (a.extend === '*') { return 1; }
	if (b.extend === '*') { return -1; }
	if (a.extend === '+') { return 1; }
	if (b.extend === '+') { return -1; }
	if (a.extend === '?') { return 1; }
	return -1;
}

const fileRegex = /^((?:-?\d+\.)?)([:$]?)([a-zA-Z0-9_-]+)(\${0,3}|[?*+])(?:(?:\.([a-z]+))?\.([a-z]+))?$/;
function toInfo(filename: string): null | ValidInfo {
	const res = fileRegex.exec(filename);
	if (!res) { return null; }
	const no = Number.parseInt(res[1]) || 0;
	const tuple = Boolean(res[2]);
	const extend = res[4]
		.replace(/\${3}$/, '+')
		.replace(/\${2}$/, '*')
		.replace(/\${1}$/, '?');
	const type = res[5] || '';
	const extname = res[6] || '';
	const name = !extname || res[1] || tuple || extend || res[3] !== 'index'
		? [tuple && ':', res[3], extend].filter(Boolean).join('') : '';
	return { filename, name, type, extname, extend, no, tuple};
}

function isValid(t: null | ValidInfo): t is ValidInfo {
	return Boolean(t);
}

async function isFile(path: string) {
	return fsPromise.stat(path).then(s => s.isFile()).catch(() => false);
}
async function isDir(path: string) {
	return fsPromise.stat(path).then(s => s.isDirectory()).catch(() => false);
}

export default async function scan(
	root: string,
	router: Router,
	registers?:  Record<string, Scanner.Register>,
	path: string = '',
	scope: string[] = [],
): Promise<void> {
	const routers: Record<string, Router> = {};
	function getRouter(name: string) {
		if (!name) { return router; }
		let child = name in routers && routers[name];
		if (!child) {
			child = router.route(name);
			routers[name] = child;
		}
		return child;
	}
	const list = await fsPromise.readdir(pathFn.resolve(root, path), 'utf-8')
		.catch(() => []);
	for (const item of list.map(toInfo).filter(isValid).sort(sort)) {
		const {filename, name, extname, type} = item;
		const newPath = pathFn.join(path, filename);
		const newScope = name ? [...scope, name ] : scope;
		if (!extname) {
			if (await isDir(pathFn.resolve(root, newPath))) {
				await scan(root, getRouter(name), registers, newPath, newScope);
			}
		} else if (await isFile(pathFn.resolve(root, newPath))) {
			await register(
				{extname, type, root, path: newPath, scope: newScope},
				getRouter(name),
				registers
			);
		}
	}
}
