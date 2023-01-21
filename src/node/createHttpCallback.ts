import type { ServerResponse, IncomingMessage } from 'node:http';
import type { Http2ServerRequest } from 'node:http2';
import { Http2ServerResponse } from 'node:http2';
import type { K99Response, K99Request, Method } from 'k99';
import type { Readable } from 'node:stream';
import * as urlFn from 'node:url';


function createRead(req: Readable) {
	let current = 0;
	let cb: null | ((v: Uint8Array | null) => void) = null;
	let end = false;
	const dataList: Buffer[] = [];
	let dataSize = 0;
	const list: [number, (v: Uint8Array | null) => void][] = [];
	let running = false;
	function get(size?: number) {
		const chunk = Buffer.concat(dataList, dataSize);
		if (size && dataSize > size) {
			dataList.length = 0;
			dataList.push(chunk.slice(size));
			dataSize -= size;
			return chunk.slice(0, size);
		}
		dataSize = 0;
		dataList.length = 0;
		return chunk;
	}
	function add(data: string | Buffer) {
		const buffer = typeof data === 'string' ? Buffer.from(data) : data;
		dataSize += buffer.length || 0;
		dataList.push(buffer);
		return dataSize;
	}
	function nextData(): Buffer | null {
		const data = current ? req.read(current) : req.read();
		return typeof data === 'string' ? Buffer.from(data) : data;
	}
	function runCb(v: Buffer | null) {
		if (!cb) { return; }
		cb(v);
		[current, cb] = list.shift() || [0, null];
	}
	function runMain() {
		for (;;) {
			if (!cb) { return; }
			if (end) {
				runCb(dataSize ? get(current) : null);
				continue;
			}
			if (!current && dataSize) {
				runCb(get(current));
				continue;
			}
			const data: Buffer | null = nextData();
			if (data === null) { return; }
			if (current) {
				if (add(data) < current) { continue; }
				runCb(get(current));
				continue;
			}
			runCb(data);
		}
	}
	let setEnd = false;
	function run() {
		running = true;
		runMain();
		if (setEnd) {
			end = true;
			runMain();
		}
		running = false;
	}
	req.addListener('end', () => {
		if (end || setEnd) { return; }
		if (running) {
			setEnd = true;
		} else {
			end = true;
			run();
		}
	});
	return function read(size: number = 0): Promise<Uint8Array | null> {
		return new Promise(resolve => {
			size = Math.max(size, 0);
			if (cb) {
				list.push([size, resolve]);
				return;
			}
			current = size;
			cb = resolve;
			run();
		});
	};
}
function createRequest(req: IncomingMessage | Http2ServerRequest): K99Request {
	const urlInfo = urlFn.parse(req.url || '/', true);
	return {
		method: (req.method || 'GET').toUpperCase()  as Method,
		url: req.url || '/',
		headers: req.headers,
		pathname: 'pathname' in req && req['pathname'] as string
		|| urlInfo.pathname
		|| '/',
		search: 'search' in req && req['search']  as string || urlInfo.search || '',
		query: 'query' in req && req['query'] as {} || urlInfo.query || {},
		read: createRead(req),
		aborted: new Promise((_, r) => {
			const end = (err?: Error) => {
				req.off('end', end);
				req.off('error', end);
				if (err) { r(err); }
			};
			req.on('end', end);
			req.on('error', end);
		}),
	};

}


async function sendResponse(
	res: ServerResponse | Http2ServerResponse,
	target: K99Response,
) {
	res.statusCode = target.status;
	for (const [k, v] of Object.entries(target.headers)) {
		if (v !== undefined) {
			res.setHeader(k, v);
		}
	}
	const stream = res instanceof Http2ServerResponse ? res.stream : res;
	try {
		for await (const data of target) {
			if (res.finished) { break; }
			if (stream.write(data)) { continue; }
			await new Promise(cb => stream.once('drain', cb));
		}
	} finally {
		res.end();
	}
}
export default function createHttpCallback<
	TReq extends IncomingMessage | Http2ServerRequest,
	TRes extends ServerResponse | Http2ServerResponse,
>(
	run: (request: K99Request) => Promise<K99Response | null>,
	notFound?: (req: TReq, res: TRes, next?: () => void) => any
): (req: TReq, res: TRes, next?: () => void) => any {
	return async function httpCallback(req, res, next) {
		const r = await run(createRequest(req)).then(r => {
			if (r) { return sendResponse(res, r); }
			if (notFound) { return notFound(req, res, next); }
			if (next) { return next(); }
		}, () => {
			res.statusCode = 500;
			res.end();
		});
	};
}
