import type { Service, Context, StoreService } from './main';


function storeService<T>(
	options?: Service.Options,
): StoreService<T>;
function storeService<T>(
	destroy?: ((state: T | undefined, ctx: Context, error?: unknown) => PromiseLike<void> | void) | null,
	options?: Service.Options,
): StoreService<T>;
function storeService<T>(
	destroy?: ((state: T | undefined, ctx: Context, error?: unknown) => PromiseLike<void> | void) | null,
	exec?: ((state: T | undefined, ctx: Context) => any) | null,
	options?: Service.Options,
): StoreService<T>;
function storeService<T>(
	destroy?: ((state: T | undefined, ctx: Context, error?: unknown) => PromiseLike<void> | void) | Service.Options | null,
	exec?: ((state: T | undefined, ctx: Context) => any) | Service.Options | null,
	options?: Service.Options,
): StoreService<T> {
	const service: StoreService<T> = function (ctx) {
		let state: T | undefined;
		if (typeof destroy === 'function') {
			ctx.done(() => destroy(state, ctx), error => destroy(state, ctx, error));
		}
		if (typeof exec !== 'function') {
			return (...s: [s?: T]) => {
				if (s.length) { [state] = s; }
				return state;
			};
		}
		return (...s: [s?: T]) => {
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
