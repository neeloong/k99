
import type { Context, Handler, WriteType } from '../../types';

async function runHandle(
	context: Context,
	handle: Handler
) {
	const result = await handle(context);
	if (context.finished) { return false; }
	if (typeof result === 'boolean') { return result; }
	if (!result) { return true; }
	const e = await context.write(result as WriteType);
	if (context.finished) { return false; }
	if (e) { return true; }
	if (typeof result !== 'object') { return true; }
	if (context.headersSent) { return false; }
	context.responseType = 'application/json';
	await context.write(JSON.stringify(result));
	return false;
}

export default async function main(
	context: Context,
	handlers: Handler[],
) {
	for (const handle of handlers) {
		if (!await runHandle(context, handle)) { return; }
	}
}
