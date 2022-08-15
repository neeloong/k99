import { Method, Handler, Context, Guard } from '../../types';
import Router from '../../Router';


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
	router: Router,
	method: Method,
	path: string[],
	ctx: Context,
	setParams: (v: any) => void,
	params: object,
): Promise<Handler[] | null> {
	if (router.disabled) { return null; }
	if (!await execGuard(router.guards, ctx, setParams, params)) { return null; }
	if (ctx.destroyed) { return null; }
	for (const [route, result, subpath] of router.find(method, path)) {
		if (ctx.destroyed) { return null; }
		const newParams = {...params, ...result};
		if (!(route instanceof Router)) {
			setParams(newParams);
			return route;
		}
		const res = await find(route, method, subpath, ctx, setParams, newParams);
		if (res) { return res; }
	}
	return null;
}
