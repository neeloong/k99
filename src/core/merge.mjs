/** @import { Context, Handler } from './main/types' */
/**
 *
 * @param {Context} context
 * @param {Handler[]} handlers
 * @returns {Promise<string | boolean | object | undefined>}
 */
async function runHandles(context, handlers) {
	for (const handle of handlers) {
		const result = await handle(context);
		if (typeof result === 'boolean') { return result; }
		if (!result) { continue; }
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
