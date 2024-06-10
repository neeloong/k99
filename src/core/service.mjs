/**
 * 
 * @template T
 * @template {any[]} P
 * @overload
 * @param {(ctx: import('./main/types').Context, ...p: P) => T} exec 
 * @param {((ctx: import('./main/types').Context, error?: unknown) => PromiseLike<void> | void)?} [destroy] 
 * @param {import('./main/types').Service.Options?} [options] 
 * @returns {import('./main/types').Service<T, P>}
 */
/**
 * 
 * @template T
 * @template {any[]} P
 * @overload
 * @param {(ctx: import('./main/types').Context, ...p: P) => T} exec 
 * @param {import('./main/types').Service.Options?} [options] 
 * @returns {import('./main/types').Service<T, P>}
 */
/**
 * @template T
 * @template {any[]} P
 * @param {(ctx: import('./main/types').Context, ...p: P) => T} exec 
 * @param {((ctx: import('./main/types').Context, error?: unknown) => PromiseLike<void> | void) | import('./main/types').Service.Options | null} [destroy] 
 * @param {import('./main/types').Service.Options?} [options] 
 * @returns {import('./main/types').Service<T, P>}
 */
function service(exec, destroy, options) {
	/** @type {import('./main/types').Service<T, P>} */
	const service = function (ctx) {
		if (typeof destroy === 'function') {
			ctx.done(() => destroy(ctx), error => destroy(ctx, error));
		}
		/**
		 * @param {...any} any
		 */
		return (...any) => exec(ctx, ...any);
	};
	const {
		rootOnly,
	} = typeof destroy === 'object' && destroy
	|| typeof options === 'object' && options
		|| {};
	Object.assign(service, { rootOnly: Boolean(rootOnly) });
	return service;
}
export default service;
