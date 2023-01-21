import type {
	K99Request,
	ActionContext,
	WriteType,
	K99Response,
	Context,
	Asset,
	Handler,
	Log,
	Setting,
} from '../types';
import createRequest from '../utils/createRequest';

import createWrite from './createWrite';
import createContext from './context';

async function runHandles(
	context: ActionContext,
	handlers: Handler[],
) {
	for (const handle of handlers) {
		const result = await handle(context);
		if (context.finished) { break; }
		if (typeof result === 'boolean') { return result; }
		if (!result) { continue; }
		const e = await context.write(result as WriteType);
		if (context.finished) { break; }
		if (e) { continue; }
		if (typeof result !== 'object') { continue; }
		if (context.headersSent) { break; }
		context.responseType = 'application/json';
		await context.write(JSON.stringify(result));
		break;
	}
}

export default function main(
	req: K99Request,
	getHandlers:(
		ctx: Context,
		setParams: (v: any) => void,
	) => Promise<Handler[] | null>,
	setting: Setting,
	asset: Asset,
	log: Log,
	parent?: Context,
): Promise<K99Response | null> {
	const aborted: Promise<null> = req.aborted
		?.then(e => Promise.reject(e))
		|| new Promise(() =>{});

	const {context, setParams, destroy, sendHeaders} = createContext(
		req,
		setting,
		asset,
		log,
		aborted,
		opt => main(createRequest(opt), getHandlers, setting, asset, log, context),
		parent,
	);
	return Promise.race([
		aborted,
		getHandlers(context, setParams),
	]).then(handlers => new Promise<K99Response | null>(resolve => {
		if (!handlers) {
			destroy();
			return resolve(null);
		}

		const [writable, readable, abortResponse] = createWrite();
		aborted.catch(e => abortResponse(e));

		function send() {
			if (!sendHeaders()) { return; }
			const {status} = context;
			resolve({
				...readable,
				get status() { return status; },
				get finished() { return writable.ended; },
				headers: Object.freeze(context.getHeaders()),
				[Symbol.asyncIterator]() { return readable; },
			});
		}
		const contextS: Omit<ActionContext, keyof Context> = {
			get finished() { return writable.ended; },
			write(chunk: WriteType): Promise<boolean> {
				send();
				return writable.write(chunk);
			},
		};

		const actionContext: ActionContext = Object.create(
			context,
			Object.getOwnPropertyDescriptors(contextS),
		);
		Promise.race([
			aborted,
			runHandles(actionContext, handlers),
		]).then(() => {
			send();
			destroy();
			writable.end();
		}, e => {
			context.status = 500;
			send();
			abortResponse(e);
			destroy();
			writable.end();
		});
	}), e => {
		destroy();
		return Promise.reject(e);
	});
}
