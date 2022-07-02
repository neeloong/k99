import { Route, Method, Handler, Context, RouterRoute } from '../../types';
import Router from '../../Router';


function matchRoute(
	route: Route,
	method: Method,
	path: string,
	baseParams: object,
	parentPath: string,
) {
	if (!route.methods.has(method)) { return null; }
	const {match} = route;
	const result = match(path, parentPath);
	if (!result) { return null; }
	const params = {...baseParams, ...result};
	return params;
}

export default async function find(
	router: Router,
	context: Context,
	setParams: (v: any) => void,
	baseParams: object,
	parentPath: string,
): Promise<Handler[] | null> {
	if (router.disabled) { return null; }
	const params = {...baseParams };
	setParams(params);
	for (const guard of router.guards) {
		try {
			if (context.destroyed) { return null; }
			const ret = await guard(Object.create(context, {
				params: {value: params},
			}));
			if (!ret) { return null; }
		} catch {
			return null;
		}
	}

	const {pathname, method} = context;
	for (const route of Array.from((router as any).__routes) as (Route | RouterRoute)[]) {
		if (context.destroyed) { return null; }
		if (!route.router && !route.methods.has(method)) { continue; }
		const {match} = route;
		const result = match(pathname, parentPath);
		if (!result) { continue; }
		const thisParams = {...baseParams, ...result};
		if (!route.router) {
			setParams(thisParams);
			return route.handlers;
		}
		const {router} = route;
		const path = result.$path;
		const res = await find(router, context, setParams, thisParams,  path);
		if (res) { return res; }
	}
	return null;
}
