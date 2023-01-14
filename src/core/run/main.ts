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
	setting: Setting,
	asset: Asset,
	log: Log,
	getHandlers:(
		ctx: Context,
		setParams: (v: any) => void,
	) => Promise<Handler[] | null>,
	parent?: Context,
): Promise<K99Response | null> {
	const { aborted } = req;
	const abortPromise: Promise<null> = aborted
		? aborted.then(e => Promise.reject(e))
		: new Promise(() =>{});

	const {context, setParams, destroy, sendHeaders} = createContext(
		req,
		setting,
		asset,
		log,
		abortPromise,
		opt => main(createRequest(opt), setting, asset, log, getHandlers, context),
		parent,
	);
	return Promise.race([
		abortPromise,
		getHandlers(context, setParams),
	]).then(handlers => new Promise<K99Response | null>(resolve => {
		if (!handlers) {
			destroy();
			return resolve(null);
		}

		const [writable, readable, abortResponse] = createWrite();
		abortPromise.finally(abortResponse);

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
			abortPromise,
			runHandles(actionContext, handlers).catch(e => log.error(e)),
		]).finally(() => {
			send();
			destroy();
			writable.end();
		});
	}), e => {
		destroy();
		return Promise.reject(e);
	});
}
