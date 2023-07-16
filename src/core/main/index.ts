import type ActionContext from '../types/ActionContext';
import type Handler from '../types/handle';
import type WriteType from '../types/WriteType';
import type K99Request from '../types/K99Request';
import type { Context } from '../types/context';
import type Environment from '../types/Environment';
import type K99Response from '../types/K99Response';

import createRequest from './createRequest';

import createWrite, { isBaseWriteType } from './createWrite';
import createContext from './context';


export function isJSON(result: any) {
	if (!result) { return false; }
	if (typeof result !== 'object') { return false; }
	if (Array.isArray(result)) { return true; }
	if (isBaseWriteType(result)) { return false; }
	if (Symbol.asyncIterator in result || Symbol.iterator in result) { return false; }
	return true;
}
export function replacer(k: any, v: any) {
	if (typeof v === 'bigint') {
		return String(v);
	}
	return v;
}
async function runHandle(
	context: ActionContext,
	handle: Handler,
) {
	if (context.headersSent) { return; }
	const result = await handle(context);
	if (context.finished) { return; }
	if (isJSON(result)) {
		if (context.headersSent) { return; }
		context.responseType = 'application/json';
		await context.write(JSON.stringify(result, replacer));
		return;
	}
	return context.write(result as WriteType);

}

function signal2promise(signal: AbortSignal) {
	return new Promise<void>((_, reject) => {
		if (signal.aborted) {
			return reject(signal.reason);
		}
		signal.addEventListener(
			'abort',
			() => reject(signal.reason),
			{ once: true }
		);
	});
}

export default function main(
	req: K99Request,
	getHandler:(
		ctx: Context,
		setParams: (v: any) => void,
	) => PromiseLike<Handler | null> | Handler | null,
	environment?: Environment,
	parent?: Context,
): Promise<K99Response | null> {
	const aborted = signal2promise(req.signal);
	const {context, setParams, destroy, sendHeaders} = createContext(
		req,
		opt => main(createRequest(opt), getHandler, environment, context),
		environment,
		parent,
	);
	return Promise.race([
		aborted,
		Promise.resolve().then(() => getHandler(context, setParams)),
	]).then(handler => new Promise<K99Response | null>(resolve => {
		if (!handler) {
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
			runHandle(actionContext, handler),
		]).then(() => {
			send();
			destroy();
			writable.end();
		}, e => {
			context.status = 500;
			send();
			abortResponse(e);
			destroy(e || true);
			writable.end();
		});
	}), e => {
		destroy(e || true);
		return Promise.reject(e);
	});
}
