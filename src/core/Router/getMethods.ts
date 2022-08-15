import type { Method } from '../types';
const methods = new Set(['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS']);

function isMethod(v: any): v is Method {
	return methods.has(v);
}

export default function getMethods(methods: Method | Iterable<Method>): Method[] {
	if (typeof methods === 'string') {
		return [methods.toUpperCase()].filter(isMethod);
	}
	if (methods && typeof methods[Symbol.iterator] === 'function') {
		return [...methods]
			.map(v => typeof v === 'string' && v.toUpperCase())
			.filter(isMethod);
	}
	if (length in methods) {
		return Array.from(methods)
			.map(v => typeof v === 'string' && v.toUpperCase())
			.filter(isMethod);
	}
	return ['GET', 'POST', 'PUT', 'DELETE'];
}
