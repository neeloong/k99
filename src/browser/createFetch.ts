import type { App } from 'k99';
import createRequest from './createRequest';
import createResponse from './createResponse';
export default function createFetch(
	app: App,
	notFound?: null | ((request: Request) => Response | Promise<Response>),
	searchParser?: (search: string) => Record<string, string | string[]>
): (input: RequestInfo, init?: RequestInit) => Promise<Response> {
	return async function fetch(input: RequestInfo, init?: RequestInit) {
		const request = new Request(input, init);
		const {signal} = request;
		if (signal.aborted) {
			return Promise.reject(new DOMException('The user aborted a request.'));
		}
		const r = await app.request(createRequest(request, searchParser));
		if (r) { return createResponse(r); }
		if (typeof notFound === 'function') { return notFound(request); }
		return new Response(null, { status: 404 });
	};
}
