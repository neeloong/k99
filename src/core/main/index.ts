import type { Handler } from '../types/handle';
import type { Context } from '../types/context';
import type { Options } from '../types/Options';

import createContext from './context';
import toBodyData from './toBodyData';

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
	getHandler: (
		ctx: Context,
		setParams: (v: any) => void,
	) => PromiseLike<Handler | null> | Handler | null,
	options: Options = {},
	parent?: Context,
): Promise<Response | null> {
	const { runner, error, method, environment } = options;
	const aborted = signal2promise(request.signal);
	const { context, setParams, destroy } = createContext(
		request,
		req => main(req, getHandler, options, context),
		method,
		error,
		environment,
		parent,
	);
	function run() {
		return Promise.race([
			aborted,
			Promise.resolve().then(() => getHandler(context, setParams)),
		]).then(handler => handler ? Promise.race([aborted, handler(context)]).then(result => {
			if (result instanceof Response) {
				return result;
			}
			const headers = new Headers(context.responseHeaders);
			const { status } = context;
			if (!result) { return new Response(null, { status, headers }); }
			const data = toBodyData(result, aborted);
			if (!data) {
				return new Response(null, { status, headers });
			}
			const [body, size, type] = data;
			if (type && !headers.get('Content-Type')) {
				headers.set('Content-Type', type);
			}
			if (size > 0 && !headers.get('Content-Length')) {
				headers.set('Content-Length', String(size));
			}
			return new Response(body, { status, headers });
		}) : null).then(response => {
			destroy();
			return response;
		}, e => {
			destroy(e || true);
			return Promise.reject(e);
		});
	}
	return runner ? runner(context, run) : run();
}
