import type { Method } from '../main';

const methods = new Set(['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS']);

function isMethod(v: any): v is Method { return methods.has(v); }
export default function getMethods(methods?: Method | Iterable<Method> | ArrayLike<Method>): Method[] {
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
