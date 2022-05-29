import type { K99Response } from 'k99';

function createHeaders(target: K99Response) {
	const headers = new Headers();
	for (const [k, v] of Object.entries(target.headers)) {
		for (const it of [v].flat()) {
			headers.append(k.toLowerCase(), String(it));
		}
	}
	return headers;
}

export default function createResponse(target: K99Response): Response {
	return new Response(new ReadableStream<Uint8Array>({
		async pull(controller) {
			const { value, done } = await target.next();
			if (done) {
				controller.close();
			} else {
				controller.enqueue(value);
			}
		},
		async cancel(reason) {
			return target.throw(reason).then(() => {}, () => {});
		},
	}), {
		status: target.status,
		headers: createHeaders(target),
	});

}
