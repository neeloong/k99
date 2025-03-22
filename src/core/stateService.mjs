/** @import { Context, Service, StateService } from './main/types' */
/**
 *
 * @template T
 * @overload
 * @param {(ctx: Context) => T} init
 * @param {Service.Options} [options]
 * @returns {StateService<T>}
 */
/**
 *
 * @template T
 * @overload
 * @param {(ctx: Context) => T} init
 * @param {((state: T | undefined, ctx: Context, error?: unknown) => PromiseLike<void> | void)?} [destroy]
 * @param {Service.Options?} [options]
 * @returns {StateService<T>}
 */
/**
 *
 * @template T
 * @overload
 * @param {(ctx: Context) => T} init
 * @param {((state: T | undefined, ctx: Context, error?: unknown) => PromiseLike<void> | void)?} [destroy]
 * @param {((state: T, ctx: Context) => any)?} [exec]
 * @param {Service.Options?} [options]
 * @returns {StateService<T>}
 */
/**
 * @template T
 * @param {(ctx: Context) => T} init
 * @param {((state: T | undefined, ctx: Context, error?: unknown) => PromiseLike<void> | void) | Service.Options | null} [destroy]
 * @param {((state: T, ctx: Context) => any) | Service.Options | null} [exec]
 * @param {Service.Options?} [options]
 * @returns {StateService<T>}
 */
function stateService(init, destroy, exec, options) {
	/** @type {StateService<T>} */
	const service = function (ctx) {
		const state = init(ctx) || /** @type {T} */({});
		if (typeof destroy === 'function') {
			ctx.done(() => destroy(state, ctx), error => destroy(state, ctx, error));
		}
		if (typeof exec !== 'function') {
			return () => state;
		}
		return () => {
			exec(state, ctx);
			return state;
		};
	};
	const {
		rootOnly,
	} = typeof destroy === 'object' && destroy
		|| typeof exec === 'object' && exec
		|| typeof options === 'object' && options
		|| {};
	Object.assign(service, { rootOnly: Boolean(rootOnly) });
	return service;
}
export default stateService;
