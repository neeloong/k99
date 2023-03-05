import ActionContext from './types/ActionContext';
import Handler from './types/handle';

async function runHandles(
	context: ActionContext,
	handlers: Handler[]
) {
	for (const handle of handlers) {
		if (context.headersSent) { break; }
		const result = await handle(context);
		if (context.finished) { break; }
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
