/**
 * 
 * @template T
 * @overload
 * @param {(ctx: import('./main/types').Context) => T} init 
 * @param {import('./main/types').Service.Options} [options] 
 * @returns {import('./main/types').StateService<T>}
 */
/**
 * 
 * @template T
 * @overload
 * @param {(ctx: import('./main/types').Context) => T} init 
 * @param {((state: T | undefined, ctx: import('./main/types').Context, error?: unknown) => PromiseLike<void> | void)?} [destroy] 
 * @param {import('./main/types').Service.Options?} [options] 
 * @returns {import('./main/types').StateService<T>}
 */
/**
 * 
 * @template T
 * @overload
 * @param {(ctx: import('./main/types').Context) => T} init 
 * @param {((state: T | undefined, ctx: import('./main/types').Context, error?: unknown) => PromiseLike<void> | void)?} [destroy] 
 * @param {((state: T, ctx: import('./main/types').Context) => any)?} [exec] 
 * @param {import('./main/types').Service.Options?} [options] 
 * @returns {import('./main/types').StateService<T>}
 */
/**
 * @template T
 * @param {(ctx: import('./main/types').Context) => T} init 
 * @param {((state: T | undefined, ctx: import('./main/types').Context, error?: unknown) => PromiseLike<void> | void) | import('./main/types').Service.Options | null} [destroy] 
 * @param {((state: T, ctx: import('./main/types').Context) => any) | import('./main/types').Service.Options | null} [exec] 
 * @param {import('./main/types').Service.Options?} [options] 
 * @returns {import('./main/types').StateService<T>}
 */
function stateService(init, destroy, exec, options) {
	/** @type {import('./main/types').StateService<T>} */
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
