import type { ActionContext } from '../types/ActionContext';
import type { Handler } from '../types/handle';
import type { WriteType } from '../types/WriteType';
import type { Context } from '../types/context';
import type { Environment } from '../types/Environment';

import createWrite, { isBaseWriteType } from './createWrite';
import createContext from './context';
import type { Runner } from '../types/Runner';


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

function signal2promise(signal: AbortSignal) {
	return new Promise<never>((_, reject) => {
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
	request: Request,
	getHandler:(
		ctx: Context,
		setParams: (v: any) => void,
	) => PromiseLike<Handler | null> | Handler | null,
	environment?: Environment,
	runner?: Runner,
	parent?: Context,
): Promise<Response | null> {
	const aborted = signal2promise(request.signal);
	const {context, setParams, destroy, sendHeaders} = createContext(
		request,
		req => main(req, getHandler, environment, runner, context),
		environment,
		parent,
	);
	function run() {
		return Promise.race([
			aborted,
			Promise.resolve().then(() => getHandler(context, setParams)),
		]).then(handler => new Promise<Response | null>(resolve => {
			if (!handler) {
				destroy();
				return resolve(null);
			}
			const { writable, readable } = new TransformStream();
			const writeData = createWrite(writable);
			let ended = false;
			function abort(e?: any) {
				writable.abort(e || new DOMException('The user aborted a request.'));
			}
			aborted.catch(e => abort(e));

			function send(response?: Response) {
				if (!sendHeaders()) { return; }
				if (response) {
					resolve(response);
					return;
				}
				const headers = new Headers(context.responseHeaders);
				const {status} = context;
				resolve(new Response(readable, { status, headers }));
			}
			const contextS: Omit<ActionContext, keyof Context> = {
				get finished() { return ended; },
				write(chunk: WriteType): Promise<boolean> {
					send();
					return writeData.write(chunk);
				},
			};

			const runHandle = async function (
			) {
				const actionContext: ActionContext = Object.create(
					context,
					Object.getOwnPropertyDescriptors(contextS),
				);
				if (actionContext.headersSent) { return; }
				const result = await handler(actionContext);
				if (ended) { return; }
				if (result instanceof Response) { return send(result); }
				if (!isJSON(result)) {
					send();
					await writeData.write(result as WriteType);
					return;
				}
				if (actionContext.headersSent) { return; }
				actionContext.responseType = 'application/json';
				send();
				await writeData.write(JSON.stringify(result, replacer));

			};
			Promise.race([aborted, runHandle()]).then(() => {
				send();
				destroy();
				ended = true;
				writeData.end();
			}, e => {
				context.status = 500;
				send();
				abort(e);
				destroy(e || true);
				ended = true;
				writeData.end();
			});
		}), e => {
			destroy(e || true);
			return Promise.reject(e);
		});
	}
	return runner ? runner(context, run) : run();
}
