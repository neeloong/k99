import Handler from '../types/handle';
import Method from '../types/method';
import toMatch from './toMatch';
import { Route, RouterRoute } from './index';

export default function verb(
	routes: (Route | RouterRoute)[],
	methods: Method[],
	a?: string | Handler,
	b?: Handler
) {
	const path = typeof a === 'string' ? a : '';
	const handler = [a, b].find((v: any): v is Handler => typeof v === 'function');
	if (!handler) { return () => {}; }
	const route: Route = {
		match: toMatch(path || '', true),
		methods: new Set(methods),
		handler,
	};
	routes.push(route);
	let removed = false;
	return () => {
		if (removed) { return; }
		removed = true;
		const index = routes.indexOf(route);
		if (index < 0) { return; }
		routes.splice(index, 1);
	};
}
