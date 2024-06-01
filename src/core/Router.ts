import type { Context, FindHandler, Handler, Method } from './main';

export interface Guard {
	(ctx: Context): PromiseLike<boolean | Handler | void> | boolean | Handler | void;
}
export type FindItem = [
	Handler | Router,
	Record<string, any>,
	string[],
];
export interface Finder {
	(this: Router, method: Method, path: string[]):
	| AsyncIterable<FindItem>
	| Iterable<FindItem>

}

async function execGuard(
	guards: Set<Guard>,
	ctx: Context,
	setParams: (v: any) => void,
	params: object,
) {
	if (!guards.size) { return true; }
	setParams(params);
	for (const guard of guards) {
		if (ctx.destroyed) { return false; }
		const ret = await guard(Object.create(ctx, {
			params: { value: { ...params } },
		}));
		if (ret === false) { return false; }
		if (typeof ret === 'function') { return ret; }
	}
	return true;
}
async function find(
	route: Router | Handler,
	path: string[],
	ctx: Context,
	setParams: (v: any) => void,
	params: object,
): Promise<Handler | null> {
	if (!(route instanceof Router)) {
		setParams(params);
		return route;
	}
	if (route.disabled) { return null; }
	const guardResult = await execGuard(route.guards, ctx, setParams, params);
	if (!guardResult) { return null; }
	if (typeof guardResult === 'function') { return guardResult; }
	if (ctx.destroyed) { return null; }
	for await (const [r, result, p] of route.find(ctx.method, path)) {
		if (ctx.destroyed) { return null; }
		const res = await find(r, p, ctx, setParams, { ...params, ...result });
		if (res) { return res; }
	}
	return null;
}
function uriDecode(t: string) {
	try {
		return decodeURIComponent(t);
	} catch {
		return t;
	}
}

abstract class Router {
	disabled = false;
	abstract find(method: Method, path: string[]):
	| AsyncIterable<FindItem>
	| Iterable<FindItem>;
	static make(routers: Router[]): FindHandler {
		return async (ctx: Context, setParams: (v: any) => void) => {
			const list = routers.flat();
			const path = ctx.url.pathname.split('/').filter(Boolean).map(uriDecode);
			for (const route of list) {
				const res = await find(route, path, ctx, setParams, {});
				if (res) { return res; }
			}
			return null;
		};
	}

	static create(find: Finder): Router {
		return Object.create(Router.prototype, {
			'find': { configurable: true, value: find, writable: true },
		});
	}
	readonly guards = new Set<Guard>();
}
export default Router;
