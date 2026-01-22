/** @import { Handler, Method } from '../main/types' */
/** @import { Binder, Match, Route, RouterRoute } from './index.mjs' */
import toMatch from './toMatch.mjs';

/**
 *
 * @param {(Route | RouterRoute)[]} routes
 * @param {Set<Method>} methods
 * @param {Match | undefined} match
 * @param {Handler[]} handlers
 * @returns {() => void}
 */
function bind(routes, methods, match, handlers) {
	/** @type {Route} */
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
/** @type {(v: any) => v is Handler} */
const findHandler = v => typeof v === 'function';
/**
 *
 * @param {(Route | RouterRoute)[]} routes
 * @param {Iterable<Method>} methods
 * @param {any[]} p
 * @returns {Binder | (() => void)}
 */
export default function verb(routes, methods, p) {
	const methodSet = new Set(methods);
	if (!p.length) {
		const match = undefined;
		/** @type {Binder} */
		return (...handlers) => bind(routes, methodSet, match, handlers);
	}
	const [path] = p;
	if (path && typeof path === 'object') {
		const match = toMatch([path, p.slice(1)], true);
		/** @type {Binder} */
		return (...handlers) => bind(routes, methodSet, match, handlers);
	}
	const match = toMatch(typeof path === 'string' ? path : '', true);
	const handlers = p.filter(findHandler);
	if (!handlers.length) {
		/** @type {Binder} */
		return (...handlers) => bind(routes, methodSet, match, handlers);
	}
	return bind(routes, methodSet, match, handlers);
}
