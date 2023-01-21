import type { Context, ServiceContext } from 'k99';
import readText from './readText.util';


function getNameValue(s: string): [string, string] {
	const index = s.indexOf('=');
	if (index < 0) {
		return [decodeURIComponent(s), ''];
	}
	return [
		decodeURIComponent(s.substring(0, index)),
		decodeURIComponent(s.substring(index + 1)),
	];

}
function parseQuery(s: string): Record<string, string | string[]> {
	const query: Record<string, string | string[]> = {};
	for (const k of s.split('&').filter(Boolean)) {
		const [index, value] = getNameValue(k);
		if (index in query) {
			query[index] = [query[index], value].flat();
		} else {
			query[index] = [value];
		}
	}
	return query;
}

async function parse(ctx: Context) {
	try {
		let data = await readText(ctx.read);
		if (!data.length) { return null; }
		return parseQuery(data);
	} catch { }
	return null;
}
function exec(ctx: Context) {
	const [mime, charset] = ctx.requestType.replace(/\s/g, '').split(';');
	if (mime !== 'application/x-www-form-urlencoded') { return null; }
	if (charset && charset !== 'charset=UTF-8') { return null; }
	return parse(ctx);
}

function formBodyService(
	ctx: ServiceContext<Promise<any> | null, false>,
): Promise<any> | null;
function formBodyService(
	ctx: ServiceContext<Promise<any> | null, true>,
): void;
function formBodyService(
	ctx: ServiceContext<Promise<any> | null>,
): Promise<any> | null | void {
	if (ctx.destroying) { return; }
	const res = ctx.state;
	if (res !== undefined) { return res; }
	const result = exec(ctx);
	ctx.state = result;
	return result;
}
export default formBodyService;
