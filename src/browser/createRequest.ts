import type { K99Request, Method, K99Headers } from 'k99';
import createBufferRead from './createBufferRead';
import createStreamRead from './createStreamRead';

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
			query[index] = value;
		}
	}
	return query;
}
function getHeaders(h: Headers) {
	const headers: K99Headers = {};
	for (const [k, v] of h.entries()) {
		headers[k.toLowerCase()] = v;
	}
	return headers;
}
export default function createRequest(
	request: Request,
	searchParser: (search: string) => Record<string, string | string[]> = parseQuery
): K99Request {
	const url = new URL(request.url);
	const {body, signal} = request;

	const aborted = new Promise<void>((_, reject) => {
		if (signal.aborted) {
			return reject(signal.reason);
		}
		signal.addEventListener(
			'abort',
			() => reject(signal.reason),
			{ once: true }
		);
	});
	return {
		method: (request.method || 'GET').toUpperCase()  as Method,
		url: `${ url.pathname }${ url.search }` || '/',
		headers: getHeaders(request.headers),
		pathname:  url.pathname || '/',
		search: url.search || '',
		query: searchParser(url.search.substring(1)),
		aborted,
		read: body ? createStreamRead(body) : createBufferRead(request),
	};

}
