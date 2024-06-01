import type { Context, Handler } from './main';

async function runHandles(
	context: Context,
	handlers: Handler[]
) {
	for (const handle of handlers) {
		const result = await handle(context);
		if (typeof result === 'boolean') { return result; }
		if (!result) { continue; }
		return result;
	}
}

export default function merge(
	...handlers: (Handler | Handler[])[]
): Handler {
	return ctx => runHandles(ctx, handlers.flat());
}
