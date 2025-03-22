/** @import { Context, Service } from './main/types' */
/**
 *
 * @template T
 * @template {any[]} P
 * @overload
 * @param {(ctx: Context, ...p: P) => T} exec
 * @param {((ctx: Context, error?: unknown) => PromiseLike<void> | void)?} [destroy]
 * @param {Service.Options?} [options]
 * @returns {Service<T, P>}
 */
/**
 *
 * @template T
 * @template {any[]} P
 * @overload
 * @param {(ctx: Context, ...p: P) => T} exec
 * @param {Service.Options?} [options]
 * @returns {Service<T, P>}
 */
/**
 * @template T
 * @template {any[]} P
 * @param {(ctx: Context, ...p: P) => T} exec
 * @param {((ctx: Context, error?: unknown) => PromiseLike<void> | void) | Service.Options | null} [destroy]
 * @param {Service.Options?} [options]
 * @returns {Service<T, P>}
 */
function service(exec, destroy, options) {
	/** @type {Service<T, P>} */
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
