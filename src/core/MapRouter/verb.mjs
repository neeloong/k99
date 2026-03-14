/** @import { Method } from '../main/types' */
/** @import { Binder, Match, Route, RouterRoute } from './index.mjs' */
import toMatch from './toMatch.mjs';

/**
 *
 * @template {Function} T
 * @param {(Route<T> | RouterRoute<T>)[]} routes
 * @param {Set<Method>} methods
 * @param {Match | undefined} match
 * @param {T[]} handlers
 * @returns {() => void}
 */
function bind(routes, methods, match, handlers) {
	/** @type {Route<T>} */
	const route = { match, methods, handlers: handlers };
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
/** @type {(v: any) => v is Function} */
const findHandler = v => typeof v === 'function';
/**
 *
 * @template {Function} T
 * @param {(Route<T> | RouterRoute<T>)[]} routes
 * @param {Iterable<Method>} methods
 * @param {any[]} p
 * @returns {Binder<T> | (() => void)}
 */
export default function verb(routes, methods, p) {
	const methodSet = new Set(methods);
	if (!p.length) {
		const match = undefined;
		/** @type {Binder<T>} */
		return (...handlers) => bind(routes, methodSet, match, handlers);
	}
	const [path] = p;
	if (path && typeof path === 'object') {
		const match = toMatch([path, p.slice(1)], true);
		/** @type {Binder<T>} */
		return (...handlers) => bind(routes, methodSet, match, handlers);
	}
	const match = toMatch(typeof path === 'string' ? path : '', true);
	const handlers = p.filter(findHandler);
	if (!handlers.length) {
		/** @type {Binder<T>} */
		return (...handlers) => bind(routes, methodSet, match, handlers);
	}
	return bind(routes, methodSet, match, handlers);
}
