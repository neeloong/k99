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
	const {context, setParams, destroy} = createContext(
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
			function abort(e?: any) {
				writable.abort(e || new DOMException('The user aborted a request.'));
			}
			aborted.catch(e => abort(e));

			Promise.race([aborted, handler(context)]).then(result => {
				if (result instanceof Response) {
					resolve(result);
				} else  {
					const json = isJSON(result);
					let value = result as WriteType;
					if (json) {
						context.responseType = 'application/json';
						value = JSON.stringify(result, replacer);
					}
					const headers = new Headers(context.responseHeaders);
					const {status} = context;
					resolve(new Response(readable, { status, headers }));
					writeData.write(value);
					writeData.end();
				}
				destroy();
			}, e => {
				context.status = 500;
				const headers = new Headers(context.responseHeaders);
				const {status} = context;
				resolve(new Response(readable, { status, headers }));
				abort(e);
				destroy(e || true);
				writeData.end();
			});
		}), e => {
			destroy(e || true);
			return Promise.reject(e);
		});
	}
	return runner ? runner(context, run) : run();
}
