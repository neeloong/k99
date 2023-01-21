import run from './run';
import type { Method, Handler, Guard, Context, Asset, Log, Setting, K99Request, K99Response } from './types';

async function execGuard(
	guards: Set<Guard>,
	ctx: Context,
	setParams: (v: any) => void,
	params: object,
) {
	if (!guards.size) { return true; }
	setParams(params);
	for (const guard of guards) {
		try {
			if (ctx.destroyed) { return false; }
			const ret = await guard(Object.create(ctx, {
				params: {value: {...params }},
			}));
			if (!ret) { return false; }
		} catch {
			return false;
		}
	}
	return true;
}
async function find(
	route: Router | Handler[],
	path: string[],
	ctx: Context,
	setParams: (v: any) => void,
	params: object,
): Promise<Handler[] | null> {
	if (!(route instanceof Router)) {
		setParams(params);
		return route;
	}
	if (route.disabled) { return null; }
	if (!await execGuard(route.guards, ctx, setParams, params)) { return null; }
	if (ctx.destroyed) { return null; }
	for await (const [r, result, p] of route.find(ctx.method, path)) {
		if (ctx.destroyed) { return null; }
		const res = find(r, p, ctx, setParams, {...params, ...result});
		if (res) { return res; }
	}
	return null;
}

abstract class Router {
	disabled = false;
	readonly plugin?: string;
	constructor(plugin?: string) { this.plugin = plugin; }
	abstract find(method: Method, path: string[]):
	| AsyncIterable<[Handler[] | Router, Record<string, any>, string[]]>
	| Iterable<[Handler[] | Router, Record<string, any>, string[]]>;
	static async find(
		ctx: Context,
		setParams: (v: any) => void,
		...routers: (Router | Router[])[]
	) {
		const path = ctx.pathname.split('/').filter(Boolean);
		for (const route of routers.flat()) {
			const res = await find(route, path, ctx, setParams, {});
			if (res) { return res; }
		}
		return null;
	}
	static make(
		{setting, asset, log }: Router.MakeOptions,
		...routers: (Router | Router[])[]
	) {
		const list = routers.flat();
		return (r: K99Request) => run(r, async (ctx, setParams) => {
			const path = ctx.pathname.split('/').filter(Boolean);
			for (const route of list) {
				const res = await find(route, path, ctx, setParams, {});
				if (res) { return res; }
			}
			return null;
		}, { setting, asset, log });
	}
	readonly guards = new Set<Guard>();
}
declare namespace Router {
	export interface MakeOptions {
		asset?: Asset.Api;
		setting?: Setting.Api;
		log?: Log.Api;
	}
}
export default Router;
