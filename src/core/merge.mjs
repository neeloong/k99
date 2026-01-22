/** @import { Context, Handler, HandlerResult } from './main/types' */
/**
 *
 * @param {Context} context
 * @param {Handler[]} handlers
 * @returns {Promise<HandlerResult>}
 */
export async function runHandles(context, handlers) {
	for (const handle of handlers) {
		const result = await handle(context);
		if (result === undefined) { continue; }
		return result;
	}
}

/**
 *
 * @param  {...(Handler | Handler[])} handlers
 * @returns {Handler}
 */
export default function merge(...handlers) {
	return ctx => runHandles(ctx, handlers.flat());
}
