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
function jsonBodyService(
	ctx: ServiceContext<Promise<any> | null, false>,
): Promise<any> | null;
function jsonBodyService(
	ctx: ServiceContext<Promise<any> | null, true>,
): void;
function jsonBodyService(
	ctx: ServiceContext<Promise<any> | null>,
): Promise<any> | null | void {
	if (ctx.destroying) { return; }
	const res = ctx.state;
	if (res !== undefined) { return res; }
	const result = exec(ctx);
	ctx.state = result;
	return result;
}
export default jsonBodyService;
