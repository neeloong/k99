export default function createFetch(
	run: (request: Request) => Promise<Response | null>,
	notFound?: null | ((request: Request) => Response | Promise<Response>),
): (input: RequestInfo, init?: RequestInit) => Promise<Response> {
	return async function fetch(input: RequestInfo, init?: RequestInit) {
		const request = new Request(input, init);
		const {signal} = request;
		signal.throwIfAborted();
		const r = await run(request);
		if (r) { return r; }
		if (typeof notFound === 'function') { return notFound(request); }
		return new Response(null, { status: 404 });
	};
}
