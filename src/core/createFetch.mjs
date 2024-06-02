/**
 * 
 * @param {(request: Request) => Promise<Response | null>} run 
 * @param {((request: Request) => Response | Promise<Response>)?} [notFound] 
 * @returns {(input: RequestInfo, init?: RequestInit) => Promise<Response>}
 */
export default function createFetch(run, notFound) {
	/**
	 * @param {RequestInfo} input
	 * @param {RequestInit} [init]
	 * @returns {Promise<Response>}
	 */
	return async function fetch(input, init) {
		const request = new Request(input, init);
		const {signal} = request;
		signal.throwIfAborted();
		const r = await run(request);
		if (r) { return r; }
		if (typeof notFound === 'function') { return notFound(request); }
		return new Response(null, { status: 404 });
	};
}
