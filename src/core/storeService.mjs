/**
 *
 * @template T
 * @overload
 * @param {import('./main/types').Service.Options?} [options]
 * @returns {import('./main/types').StoreService<T>}
 */
/**
 *
 * @template T
 * @overload
 * @param {((state: T | undefined, ctx: import('./main/types').Context, error?: unknown) => PromiseLike<void> | void)?} [destroy]
 * @param {import('./main/types').Service.Options?} [options]
 * @returns {import('./main/types').StoreService<T>}
 */
/**
 *
 * @template T
 * @overload
 * @param {((state: T | undefined, ctx: import('./main/types').Context, error?: unknown) => PromiseLike<void> | void)?} [destroy]
 * @param {((state: T | undefined, ctx: import('./main/types').Context) => any)?} [exec]
 * @param {import('./main/types').Service.Options?} [options]
 * @returns {import('./main/types').StoreService<T>}
 */
/**
 * @template T
 * @param {((state: T | undefined, ctx: import('./main/types').Context, error?: unknown) => PromiseLike<void> | void) | import('./main/types').Service.Options | null} [destroy]
 * @param {((state: T | undefined, ctx: import('./main/types').Context) => any) | import('./main/types').Service.Options | null} [exec]
 * @param {import('./main/types').Service.Options?} [options]
 * @returns {import('./main/types').StoreService<T>}
 */
function storeService(destroy, exec, options) {
	/** @type {import('./main/types').StoreService<T>} */
	const service = function (ctx) {
		/** @type {T | undefined} */
		let state;
		if (typeof destroy === 'function') {
			ctx.done(() => destroy(state, ctx), error => destroy(state, ctx, error));
		}
		if (typeof exec !== 'function') {
			/**
			 * @param {[s?: T]} s
			 */
			return (...s) => {
				if (s.length) { [state] = s; }
				return state;
			};
		}
		/**
		 * @param {[s?: T]} s
		 */
		return (...s) => {
			if (s.length) {
				[state] = s;
				exec(state, ctx);
			}
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
export default storeService;
