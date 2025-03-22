/** @import { Context, Handler, HandlerResult } from './main/types' */
/**
 * @callback Onionskin
 * @param {Context} ctx
 * @param {() => Promise<HandlerResult>} next
 * @returns {PromiseLike<HandlerResult> | HandlerResult}
 */

const noop = () => {};
/**
 *
 * @param  {...(Onionskin | Onionskin[])} handlers
 * @returns {Handler}
 */
export default function onionskin(...handlers) {
	/** @type {Handler} */
	let handler = noop;
	for (const os of handlers.flat()) {
		const currentHandler = handler;
		handler = async ctx => os(ctx, async () => currentHandler(ctx));
	}
	return handler;
}
