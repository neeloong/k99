import { Context } from 'k99';
import { Readable } from 'node:stream';

export default function contextToReadable(ctx: Context) {
	const {read} = ctx;
	return Readable.from((async function *() {
		for (;;) {
			const s = await read();
			if (s === null) { return; }
			yield s;
		}
	})(), {encoding: 'binary'});
}
