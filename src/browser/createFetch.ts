import type { K99Request, K99Response } from 'k99';
import createRequest from './createRequest';
import createResponse from './createResponse';
export default function createFetch(
	run: (request: K99Request) => Promise<K99Response | null>,
	notFound?: null | ((request: Request) => Response | Promise<Response>),
	searchParser?: (search: string) => Record<string, string | string[]>
): (input: RequestInfo, init?: RequestInit) => Promise<Response> {
	return async function fetch(input: RequestInfo, init?: RequestInit) {
		const request = new Request(input, init);
		const {signal} = request;
		signal.throwIfAborted();
		const r = await run(createRequest(request, searchParser));
		if (r) { return createResponse(r); }
		if (typeof notFound === 'function') { return notFound(request); }
		return new Response(null, { status: 404 });
	};
}
