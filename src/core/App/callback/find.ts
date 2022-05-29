import { Route, Method, Guard, Handler, Service } from '../../types';
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

interface Item {
	router: Router;
	params: any;
	handlers: Handler[];
}
export default async function find(
	router: Router,
	method: Method,
	path: string,
	guards: Map<Guard<any, any, any>, object>,
	baseParams: object,
	parentPath: string,
	key: number
): Promise<Item | null> {
	if (router.disabled) { return null; }
	const {match} = router;
	const result = match(path, parentPath, key);
	if (!result) { return null; }
	const params = match.isRoot ? result : {...baseParams, ...result};

	for (const guard of router.guards) {
		try {
			const v = guards.get(guard);
			const ret = await guard({
				channel: 'test',
				state: v,
			}, params, method);
			if (!ret) { return null; }
			if (typeof ret === 'object') {
				guards.set(guard, ret);
			} else if (!v) {
				guards.set(guard, {});
			}
		} catch {
			return null;
		}
	}
	const keyLen = match.isRoot ? match.keyLen : match.keyLen + key;
	const thisPath = result.$path;
	for (const route of Array.from((router as any).__routes) as (Route | Router)[]) {
		if (route instanceof Router) {
			const res = await find(
				route,
				method,
				path,
				guards,
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
		return { handlers: route.handlers, router, params: newParams };
	}
	return null;
}
