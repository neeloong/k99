import type { Context, ServiceContext } from 'k99';
import readText from './readText.util';

async function parse(ctx: Context) {
	try {
		let data = await readText(ctx.read);
		if (!data.length) { return null; }
		return JSON.parse(data);
	} catch { }
	return null;
}
function exec(ctx: Context) {
	const [mime, charset] = ctx.requestType.replace(/\s/g, '').split(';');
	if (mime !== 'application/json' && mime !== 'text/json') { return null; }
	if (charset && charset !== 'charset=UTF-8') { return null; }
	return parse(ctx);
}
export default function jsonBodyService(
	ctx: ServiceContext<{result?: Promise<any> | null}>,
): Promise<any> | null {
	if (ctx.channel !== 'exec') { return null; }
	const res = ctx.state.result;
	if (res !== undefined) { return res; }
	const result = exec(ctx);
	ctx.state.result = result;
	return result;
}
