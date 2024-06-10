/** @type {import('k99').Service<Promise<any> | null>} */
const jsonBodyService = function (ctx) {
	const [mime, charset] = ctx.requestType.replace(/\s/g, '').split(';');
	if (mime !== 'application/json' && mime !== 'text/json') { return () => null; }
	if (charset && charset !== 'charset=UTF-8') { return () => null; }
	const { request } = ctx;
	if (request.bodyUsed) { return () => null; }
	const result = request.json();
	return () => result;
};
export default jsonBodyService;
