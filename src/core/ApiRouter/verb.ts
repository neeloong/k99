import type { Handler } from '../types/handle';
import type { Method } from '../types/method';
import type { Route, RouterRoute } from './index';
import toMatch from './toMatch';

export interface Binder {
	(handler: Handler): () => void
}
function bind(
	routes: (Route | RouterRoute)[],
	methods: Method[],
	path: string,
	handler: Handler
): () => void {
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

export default function verb(
	routes: (Route | RouterRoute)[],
	methods: Method[],
	p: any[],
): Binder | (() => void) {
	if (!p.length) {
		return handler => bind(routes, methods, '', handler);
	}
	const [a, b] = p;
	if (a && typeof a === 'object') {
		const path = String.raw(a, ...p.slice(1));
		return handler => bind(routes, methods, path, handler);
	}
	const path = typeof a === 'string' ? a : '';
	const handler = [a, b].find((v: any): v is Handler => typeof v === 'function');
	if (!handler) {
		return handler => bind(routes, methods, path, handler);
	}
	return bind(routes, methods, path, handler);
}
