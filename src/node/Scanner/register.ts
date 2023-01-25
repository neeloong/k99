import * as pathFn from 'node:path';
import type { Handler, Method } from 'k99';
import Router from 'k99/router';
import type Scanner from '.';

const registers: { [key: string]: Scanner.Register; } = {};
export function setRegister(
	{ extname, type, register }: Scanner.Register,
	list: Record<string, Scanner.Register> = registers
): boolean {
	const key = `${ type || '' }.${ extname }`;
	if (!/^(?:[a-z]+)?\.[a-z]+$/.test(key)) { return false; }
	if (key in list) { return false; }
	if (typeof register !== 'function') { return false; }
	list[key] = {extname, type, register};
	return true;
}
/** 注册文件 */
export async function register(
	file: Scanner.FileItem,
	router: Router.Api,
	list?: Record<string, Scanner.Register>,
): Promise<boolean> {
	const { extname, type } = file;
	const key = `${ type || '' }.${ extname }`;
	const register = list && key in list && list[key] || key in registers && registers[key];
	if (!register) { return false; }
	return register.register({ ...file }, router);
}

function getHandlers(v: any): Handler[] | undefined {
	if (typeof v === 'function') { return [v]; }
	if (!Array.isArray(v)) { return; }
	const list = v.filter(v => typeof v === 'function') as Handler[];
	if (list.length) { return list; }
}
/** 方法列表 */
const methods = new Set<Method>(['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS']);

/** 资源的处理函数配置 */
const resourceHandleMap: Record<string, {methods: Method[], path: string}> = {
	index:   { methods: ['GET'   ], path: '' },
	create:  { methods: ['POST'  ], path: '' },
	new:     { methods: ['GET'   ], path: 'new' },
	show:    { methods: ['GET'   ], path: ':id' },
	update:  { methods: ['PUT'   ], path: ':id' },
	destroy: { methods: ['DELETE'], path: ':id' },
};

function setHandleWithMethod(router: Router.Api, path: string, item: any) {
	if (typeof item !== 'object') { return; }
	for (const method of methods) {
		const fn = item[method];
		if (typeof fn !== 'function') { continue; }
		router.verb(method, path, fn);
	}

}
const AllMethod: Method[] = ['GET', 'DELETE', 'HEAD', 'POST', 'PUT'];
function setHandleItem(router: Router.Api, path: string, item: any): void {
	if (!item) { return; }
	const list = getHandlers(item);
	if (list) {
		router.verb(AllMethod, path, ...list);
	} else {
		setHandleWithMethod(router, path, item);
	}
}


function get(
	exports: Record<string, any>,
	test: (v: any) => boolean,
	onlyDefault?: boolean
) {
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

function createRegister(
	run: (router: Router.Api, value: any) => void,
	test: (v: any) => boolean,
	onlyDefault?: boolean
) {
	return async function(file: Scanner.FileItem, router: Router.Api): Promise<boolean> {
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
		const item = exports[k] as undefined | Handler;
		if (!item) { continue; }
		if (!/^[a-z0-9][a-z0-9A-Z_-]*$/.test(k)) { continue; }
		const list = getHandlers(item);
		if (!list) {
			setHandleWithMethod(router, `:id/${ k }`, item as any);
			continue;
		}
		const info = k in resourceHandleMap && resourceHandleMap[k];
		if (info) {
			router.verb(info.methods, info.path, ...list);
		} else {
			router.verb(AllMethod, `:id/${ k }`, ...list);

		}
	}
}, v => typeof v !== 'function');
const guard = createRegister((router, exports) => {
	router.guards.add(exports);
}, v => typeof v === 'function', true);
const router = createRegister((router, exports) => {
	router.route(exports);
}, v => v instanceof Router.Api, true);


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
