import { Route, Method, Handler, Context } from '../../types';
import Router from '../../Router';


function matchRoute(
	route: Route,
	method: Method,
	path: string,
	baseParams: object,
	parentPath: string, key: number
) {
	if (!route.methods.has(method)) { return null; }
	const {match} = route;
	const result = match(path, parentPath, key);
	if (!result) { return null; }
	const params = match.isRoot ? result : {...baseParams, ...result};
	return params;
}

export default async function find(
	router: Router,
	context: Context,
	setParams: (v: any) => void,
	baseParams: object,
	parentPath: string,
	key: number
): Promise<Handler[] | null> {
	if (router.disabled) { return null; }
	const {match} = router;
	const {pathname: path, method} = context;
	const result = match(path, parentPath, key);
	if (!result) { return null; }
	const params = match.isRoot ? result : {...baseParams, ...result};
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
	const keyLen = match.isRoot ? match.keyLen : match.keyLen + key;
	const thisPath = result.$path;
	for (const route of Array.from((router as any).__routes) as (Route | Router)[]) {
		if (context.destroyed) { return null; }
		if (route instanceof Router) {
			const res = await find(
				route,
				context,
				setParams,
				params,
				thisPath,
				keyLen
			);
			if (res) { return res; }
			continue;
		}
		const newParams = matchRoute(
			route, method, path, params, thisPath, keyLen
		);
		if (!newParams) { continue; }
		setParams(newParams);
		return route.handlers;
	}
	return null;
}
