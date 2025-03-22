/** @import { Handler, Method } from '../main/types' */
/** @import { Binder, Route, RouterRoute } from './index.mjs' */
import toMatch from './toMatch.mjs';

/**
 *
 * @param {(Route | RouterRoute)[]} routes
 * @param {Method[]} methods
 * @param {string} path
 * @param {Handler} handler
 * @returns {() => void}
 */
function bind(routes, methods, path, handler) {
	/** @type {Route} */
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
/** @type {(v: any) => v is Handler} */
const findHandler = v => typeof v === 'function';
/**
 *
 * @param {(Route | RouterRoute)[]} routes
 * @param {Method[]} methods
 * @param {any[]} p
 * @returns {Binder | (() => void)}
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
