import Handler from '../types/handle';
import Method from '../types/method';
import toMatch from './toMatch';
import { Route, RouterRoute } from './index';

export default function verb(
	routes: (Route | RouterRoute)[],
	methods: Method[],
	path?: string,
	handler?: Handler
) {
	if (!handler) {
		return;
	}
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
