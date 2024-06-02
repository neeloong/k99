const methods = new Set(['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS']);
/**
 * 
 * @param {any} v 
 * @returns {v is import('../main/types').Method}
 */
function isMethod(v) { return methods.has(v); }
/**
 * 
 * @param {import('../main/types').Method | Iterable<import('../main/types').Method> | ArrayLike<import('../main/types').Method>} [methods] 
 * @returns {import('../main/types').Method[]}
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
