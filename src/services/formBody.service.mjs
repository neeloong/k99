/** @import { Service } from 'k99' */
/**
 * 
 * @param {string} s 
 * @returns {[string, string]}
 */
function getNameValue(s) {
	const index = s.indexOf('=');
	if (index < 0) {
		return [decodeURIComponent(s), ''];
	}
	return [
		decodeURIComponent(s.substring(0, index)),
		decodeURIComponent(s.substring(index + 1)),
	];

}
/**
 * 
 * @param {string} s 
 * @returns {Record<string, string | string[]>}
 */
function parseQuery(s) {
	/** @type {Record<string, string | string[]>} */
	const query = {};
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
/**
 * 
 * @param {Request} request 
 * @returns {Promise<Record<string, string | string[]> | null>}
 */
async function parse(request) {
	try {
		const data = await request.text();
		if (!data.length) { return null; }
		return parseQuery(data);
	} catch { }
	return null;
}
/** @type {Service<Promise<any> | null>} */
const formBodyService = function (ctx) {
	const [mime, charset] = ctx.requestType.replace(/\s/g, '').split(';');
	if (mime !== 'application/x-www-form-urlencoded') { return () => null; }
	if (charset && charset !== 'charset=UTF-8') { return () => null; }
	const { request } = ctx;
	if (request.bodyUsed) { return () => null; }
	const result = parse(request);
	return () => result;
};
export default formBodyService;
