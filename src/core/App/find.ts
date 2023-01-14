import { Handler, Context, Guard } from '../types';
import Router from '../Router';


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

export default async function find(
	list:  AsyncIterable<[Router | Handler[], Record<string, any>, string[]]>
	| Iterable<[Router | Handler[], Record<string, any>, string[]]>,
	ctx: Context,
	setParams: (v: any) => void,
	params: object,
): Promise<Handler[] | null> {
	for await (const [route, result, path] of list) {
		if (ctx.destroyed) { return null; }
		const newParams = {...params, ...result};
		if (!(route instanceof Router)) {
			setParams(newParams);
			return route;
		}
		if (route.disabled) { continue; }
		if (!await execGuard(route.guards, ctx, setParams, params)) { continue; }
		if (ctx.destroyed) { continue; }
		const res = await find(route.find(ctx.method, path), ctx, setParams, params);
		if (res) { return res; }
	}
	return null;
}
