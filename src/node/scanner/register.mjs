import * as pathFn from 'node:path';
import { ApiRouter, merge } from 'k99';

/** @type {{ [key: string]: import('./index.mjs').ScannerRegister; }} */
const registers = {};
/**
 * 
 * @param {import('./index.mjs').ScannerRegister} register 
 * @param {Record<string, import('./index.mjs').ScannerRegister>} [list] 
 * @returns {boolean}
 */
export function setRegister({ extname, type, register }, list = registers) {
	const key = `${ type || '' }.${ extname }`;
	if (!/^(?:[a-z]+)?\.[a-z]+$/.test(key)) { return false; }
	if (key in list) { return false; }
	if (typeof register !== 'function') { return false; }
	list[key] = {extname, type, register};
	return true;
}
/**
 * 注册文件
 * @param {import('./index.mjs').ScannerFileItem} file 
 * @param {ApiRouter} router 
 * @param {Record<string, import('./index.mjs').ScannerRegister>} [list] 
 * @returns {Promise<boolean>}
 */
export async function register(file, router, list) {
	const { extname, type } = file;
	const key = `${ type || '' }.${ extname }`;
	const register = list && key in list && list[key] || key in registers && registers[key];
	if (!register) { return false; }
	return register.register({ ...file }, router);
}
/**
 * 
 * @param {any} v 
 * @returns {import('k99').Handler | undefined}
 */
function getHandle(v) {
	if (typeof v === 'function') { return v; }
	if (!Array.isArray(v)) { return; }
	const list = /** @type {import('k99').Handler[]} */(v.filter(v => typeof v === 'function'));
	if (list.length) { return merge(list); }
}
/** @type {Set<import('k99').Method>} 方法列表 */
const methods = new Set(['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS']);

/** @type {Record<string, {methods: import('k99').Method[], path: string}>} 资源的处理函数配置 */
const resourceHandleMap = {
	index:   { methods: ['GET'   ], path: '' },
	create:  { methods: ['POST'  ], path: '' },
	new:     { methods: ['GET'   ], path: 'new' },
	show:    { methods: ['GET'   ], path: ':id' },
	update:  { methods: ['PUT'   ], path: ':id' },
	destroy: { methods: ['DELETE'], path: ':id' },
};
/**
 * 
 * @param {ApiRouter} router 
 * @param {string} path 
 * @param {any} item 
 * @returns {void}
 */
function setHandleWithMethod(router, path, item) {
	if (typeof item !== 'object') { return; }
	for (const method of methods) {
		const fn = item[method];
		if (typeof fn !== 'function') { continue; }
		router.verb(method, path, fn);
	}

}
/** @type {import('k99').Method[]} */
const AllMethod = ['GET', 'DELETE', 'HEAD', 'POST', 'PUT'];
/**
 * 
 * @param {ApiRouter} router 
 * @param {string} path 
 * @param {any} item 
 * @returns {void}
 */
function setHandleItem(router, path, item) {
	if (!item) { return; }
	const handle = getHandle(item);
	if (handle) {
		router.verb(AllMethod, path, handle);
	} else {
		setHandleWithMethod(router, path, item);
	}
}

/**
 * 
 * @param {Record<string, any>} exports 
 * @param {(v: any) => boolean} test 
 * @param {boolean} [onlyDefault] 
 * @returns 
 */
function get(exports, test, onlyDefault) {
	if (!onlyDefault) {
		const keys = Object.keys(exports);
		if (keys.length !== 1) { return exports; }
		if (keys[0] !== 'default') { return exports; }
	}
	const def = exports.default;
	if (!def) { return null; }
	if (test(def)) { return def; }
	if (onlyDefault) { return null; }
	return exports;
}
/**
 * 
 * @param {(router: ApiRouter, value: any) => void} run 
 * @param {(v: any) => boolean} test 
 * @param {boolean} [onlyDefault] 
 * @returns 
 */
function createRegister(run, test, onlyDefault) {
	/**
	 * @param {import('./index.mjs').ScannerFileItem} file
	 * @param {ApiRouter} router
	 * @returns {Promise<boolean>}
	 */
	return async function(file, router) {
		try {
			const exports = await import(pathFn.join(file.root, file.path));
			const item = get(exports, test, onlyDefault);
			if (!item){ return false; }
			run(router, item);
		} catch {
			return false;
		}
		return true;
	};
}
const collection = createRegister((router, exports) => {
	setHandleItem(router, '', exports);
	for (const k in exports) {
		if (!/^[a-z0-9][a-z0-9A-Z_-]*$/.test(k)) { continue; }
		setHandleItem(router, k, exports[k]);
	}
}, v => typeof v !== 'function');


const members = createRegister((router, exports) => {
	setHandleItem(router, '', exports);
	for (const k in exports) {
		if (!/^[a-z0-9][a-z0-9A-Z_-]*$/.test(k)) { continue; }
		setHandleItem(router, `:id/${ k }`, exports[k]);
	}
}, v => typeof v !== 'function');

const resource = createRegister((router, exports) => {
	for (const k in exports) {
		const item = /** @type {undefined | import('k99').Handler} */(exports[k]);
		if (!item) { continue; }
		if (!/^[a-z0-9][a-z0-9A-Z_-]*$/.test(k)) { continue; }
		const handle = getHandle(item);
		if (!handle) {
			setHandleWithMethod(router, `:id/${ k }`, item);
			continue;
		}
		const info = k in resourceHandleMap && resourceHandleMap[k];
		if (info) {
			router.verb(info.methods, info.path, handle);
		} else {
			router.verb(AllMethod, `:id/${ k }`, handle);

		}
	}
}, v => typeof v !== 'function');
const guard = createRegister((router, exports) => {
	router.guards.add(exports);
}, v => typeof v === 'function', true);
const router = createRegister((router, exports) => {
	router.route(exports);
}, v => v instanceof ApiRouter, true);


setRegister({ extname: 'js', register: collection });
setRegister({ extname: 'mjs', register: collection });

setRegister({ extname: 'js', type: 'resource', register: resource});
setRegister({ extname: 'mjs', type: 'resource', register: resource});


setRegister({ extname: 'js', type: 'collection', register: collection});
setRegister({ extname: 'mjs', type: 'collection', register: collection});
setRegister({ extname: 'js', type: 'static', register: collection});
setRegister({ extname: 'mjs', type: 'static', register: collection});

setRegister({ extname: 'js', type: 'members', register: members});
setRegister({ extname: 'mjs', type: 'members', register: members});


setRegister({ extname: 'js', type: 'guard', register: guard});
setRegister({ extname: 'mjs', type: 'guard', register: guard});


setRegister({ extname: 'js', type: 'router', register: router});
setRegister({ extname: 'mjs', type: 'router', register: router});
