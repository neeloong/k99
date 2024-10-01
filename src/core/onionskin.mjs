/**
 * @callback Onionskin
 * @param {import('./main/types').Context} ctx
 * @param {() => Promise<import('./main/types').HandlerResult>} next
 * @returns {PromiseLike<import('./main/types').HandlerResult> | import('./main/types').HandlerResult}
 */

const noop = () => {};
/**
 *
 * @param  {...(Onionskin | Onionskin[])} handlers
 * @returns {import('./main/types').Handler}
 */
export default function onionskin(...handlers) {
	/** @type {import('./main/types').Handler} */
	let handler = noop;
	for (const os of handlers.flat()) {
		const currentHandler = handler;
		handler = async ctx => os(ctx, async () => currentHandler(ctx));
	}
	return handler;
}
