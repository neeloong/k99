import {
	K99Request,
	Method,
	WriteType,
	K99Headers,
} from '../types';
import createRead from './createRead';

const urlRegex = /^(?:(?:https?:)?\/\/(?:(?:[^/?#]*@)?)(?:\d+|(?:\[[0-9a-f:]+\])|(?:\d{1,3}\.){3}\d{1,3}|(?:(?:[a-z0-9\u0100-\uffff]+-*)+\.)+[a-z]+)(?::\d+)?)?((?:\/?[^?#]*)?)((?:\?[^#]*)?)(?:#.*)?$/i;


function getNameValue(s: string): [string, string] {
	const index = s.indexOf('=');
	if (index < 0) {
		return [decodeURIComponent(s), ''];
	}
	return [
		decodeURIComponent(s.substring(0, index)),
		decodeURIComponent(s.substring(index + 1)),
	];

}
function parseQuery(s: string): Record<string, string | string[]> {
	const query: Record<string, string | string[]> = {};
	for (const k of s.split('&').filter(Boolean)) {
		const [index, value] = getNameValue(k);
		if (index in query) {
			query[index] = [query[index], value].flat();
		} else {
			query[index] = [value];
		}
	}
	return query;
}
function parseUrl(uri: string): [string, string] {
	const result = urlRegex.exec(uri);
	if (!result) { return ['/', '']; }
	let [, pathname, search ] = result;
	const path: string[] = [];
	for (const p of pathname.replace(/^[\\/]+/, '').replace(/[\\/]+/g, '/').split('/')) {
		if (p === '.') { continue; }
		if (p === '..') {
			path.pop();
			continue;
		}
		path.push(p);
	}
	return [`/${ path.join('/') }`, search];
}

export default function createRequest(
	{method, path, aborted, body, headers = {}}:{
		method: Method,
		path: string,
		body?: K99Request.Reader | WriteType,
		headers?: K99Headers,
		aborted?: Promise<void>,
	}
): K99Request {
	const [pathname, search] = parseUrl(path);
	return {
		method,
		url: `${ pathname }${ search }`,
		headers,
		pathname,
		search,
		aborted,
		query: parseQuery(search.substring(1)),
		read: typeof body === 'function' ? body : createRead(body),
	};
}
