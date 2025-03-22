/** @import { Method } from '../main/types' */
const methods = new Set(['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS']);
/**
 *
 * @param {any} v
 * @returns {v is Method}
 */
function isMethod(v) { return methods.has(v); }
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
