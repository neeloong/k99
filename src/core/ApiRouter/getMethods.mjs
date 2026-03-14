/** @import { Method } from '../main/types' */
/**
 *
 * @param {any} v
 * @returns {v is Method}
 */
function isMethod(v) { return Boolean(v); }
/**
 *
 * @param {Method | Iterable<Method> | ArrayLike<Method>} [methods]
 * @returns {Method[]}
 */
export default function getMethods(methods) {
	if (!methods) {
		return ['GET', 'POST', 'PUT', 'DELETE'];
	}
	if (typeof methods === 'string') {
		return [methods.toUpperCase()].filter(isMethod);
	}
	return Array.from(methods)
		.map(v => typeof v === 'string' && v.toUpperCase())
		.filter(isMethod);
}
