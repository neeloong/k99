import type { ServerResponse } from 'node:http';
import { Http2ServerResponse } from 'node:http2';
import { Readable } from 'node:stream';

export default async function linkResponse(
	res: ServerResponse | Http2ServerResponse,
	response: Response,
	onError: (e: any) => void,
) {
	res.statusCode = response.status;
	const {headers} = response;
	for (const [k, v] of headers) {
		res.setHeader(k, v);
	}
	const cookies = headers.getSetCookie();
	if (cookies.length) {
		res.setHeader('set-cookie', cookies);
	}
	const {body} = response;
	if (!body) {
		res.end();
		return;
	}
	const readable = Readable.fromWeb(body as any);
	readable.on('error', onError);
	readable.pipe(res instanceof Http2ServerResponse ? res.stream : res);
}
