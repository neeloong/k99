import type { Handler } from '../types/handle';
import type { Context } from '../types/context';
import type { WriteType } from '../types/WriteType';
import type { Environment } from '../types/Environment';

import createContext from './context';
import type { Runner } from '../types/Runner';
import str2bin from '../utils/str2bin';


function isBufferType(
	chunk: unknown
): chunk is ArrayBuffer | ArrayBufferView  | SharedArrayBuffer {
	if (chunk instanceof ArrayBuffer) { return true; }
	if (ArrayBuffer.isView(chunk)) { return true; }
	try {
		if (chunk instanceof SharedArrayBuffer) { return true; }
	} catch {

	}
	return false;
}


/**
 * 向可写流中写入数据
 * @param chunk 要写入的数据
 */
async function write(writer: WritableStreamDefaultWriter<Uint8Array>, chunk: WriteType): Promise<void> {
	if (typeof chunk === 'string') {
		return writer.write(str2bin(chunk));
	}
	if (typeof chunk !== 'object') { return; }
	if (isBufferType(chunk)) {
		return writer.write(str2bin(chunk));
	}
	if (!(Symbol.asyncIterator in chunk || Symbol.iterator in chunk)) {
		return;
	}
	for await (const data of chunk) {
		if (!data) { continue; }
		await write(writer, data);
	}
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
		]).then(handler => handler ? Promise.race([aborted, handler(context)]).then(result => {
			if (result instanceof Response) {
				return result;
			}
			const headers = new Headers(context.responseHeaders);
			const {status} = context;
			if (!result) { return new Response(null, { status, headers }); }
			let body = null;
			let size = 0;
			let type = '';
			if (result instanceof ReadableStream) {
				body = result;
			} else if (result instanceof Blob) {
				body = result;
				({size, type} = result);
			} else if (isBufferType(result)) {
				body = result;
				size = result.byteLength;
			} else if (typeof result === 'string'){
				body = str2bin(result);
				size = body.byteLength;
			} else if (Array.isArray(result)) {
				type = 'application/json';
				body = str2bin(JSON.stringify(result, replacer));
				size = body.byteLength;
			} else if (typeof result === 'object') {
				if (Symbol.asyncIterator in result || Symbol.iterator in result) {
					const { writable, readable } = new TransformStream<Uint8Array, Uint8Array>();
					body = readable;
					aborted.catch((e?: any) => {
						writable.abort(e || new DOMException('The user aborted a request.'));
					});
					const writer = writable.getWriter();
					(async () => {
						for await (const data of result) {
							if (!data) { continue; }
							await write(writer, data);
						}
						await writable.close();
					})();
				} else {
					type = 'application/json';
					body = str2bin(JSON.stringify(result, replacer));
					size = body.byteLength;
				}
			}
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
