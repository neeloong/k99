import toMatch from './toMatch.mjs';

/**
 *
 * @param {(import('./index.mjs').Route | import('./index.mjs').RouterRoute)[]} routes
 * @param {import('../main/types').Method[]} methods
 * @param {string} path
 * @param {import('../main/types').Handler} handler
 * @returns {() => void}
 */
function bind(routes, methods, path, handler) {
	/** @type {import('./index.mjs').Route} */
	const route = {
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
/** @type {(v: any) => v is import('../main/types').Handler} */
const findHandler = v => typeof v === 'function';
/**
 *
 * @param {(import('./index.mjs').Route | import('./index.mjs').RouterRoute)[]} routes
 * @param {import('../main/types').Method[]} methods
 * @param {any[]} p
 * @returns {import('./index.mjs').Binder | (() => void)}
 */
export default function verb(routes, methods, p) {
	if (!p.length) {
		return handler => bind(routes, methods, '', handler);
	}
	const [a, b] = p;
	if (a && typeof a === 'object') {
		const path = String.raw(a, ...p.slice(1));
		return handler => bind(routes, methods, path, handler);
	}
	const path = typeof a === 'string' ? a : '';
	const handler = [a, b].find(findHandler);
	if (!handler) {
		return handler => bind(routes, methods, path, handler);
	}
	return bind(routes, methods, path, handler);
}
