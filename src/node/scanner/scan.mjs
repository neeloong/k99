import * as fsPromise from 'node:fs/promises';
import * as pathFn from 'node:path';
import { register } from './register.mjs';


/**
 * @typedef {object} ValidInfo
 * @property {string} filename
 * @property {string} name
 * @property {string} extname
 * @property {string} type
 * 
 * @property {number} no
 * @property {boolean} tuple
 * @property {string} extend
 */

/**
 * 
 * @param {ValidInfo} a 
 * @param {ValidInfo} b 
 * @returns 
 */
function sort(a, b) {
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
/**
 * 
 * @param {string} filename 
 * @returns {ValidInfo?}
 */
function toInfo(filename) {
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

/**
 * 
 * @param {ValidInfo?} t 
 * @returns {t is ValidInfo}
 */
function isValid(t) {
	return Boolean(t);
}

/**
 * 
 * @param {string} path 
 * @returns 
 */
async function isFile(path) {
	return fsPromise.stat(path).then(s => s.isFile()).catch(() => false);
}
/**
 * 
 * @param {string} path 
 * @returns 
 */
async function isDir(path) {
	return fsPromise.stat(path).then(s => s.isDirectory()).catch(() => false);
}

/**
 * 
 * @param {string} root 
 * @param {import('k99').ApiRouter} router 
 * @param {Record<string, import('./index.mjs').ScannerRegister>} [registers] 
 * @param {string} [path] 
 * @param {string[]} [scope] 
 * @returns {Promise<void>}
 */
export default async function scan(root, router, registers, path = '', scope = []) {
	/** @type {Record<string, import('k99').ApiRouter>} */
	const routers = {};
	/**
	 * 
	 * @param {string} name 
	 * @returns 
	 */
	function getRouter(name) {
		if (!name) { return router; }
		const child = name in routers && routers[name];
		if (child) { return child; }
		return routers[name] = router.route(name);
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
