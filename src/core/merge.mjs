/**
 * 
 * @param {import('./main/types').Context} context 
 * @param {import('./main/types').Handler[]} handlers 
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
 * @param  {...(import('./main/types').Handler | import('./main/types').Handler[])} handlers 
 * @returns {import('./main/types').Handler}
 */
export default function merge(...handlers) {
	return ctx => runHandles(ctx, handlers.flat());
}
