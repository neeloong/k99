import type { Service, Context, StateService } from './types/context';


function stateService<T>(
	init: (ctx: Context) => T,
	options?: Service.Options,
): StateService<T>;
function stateService<T>(
	init: (ctx: Context) => T,
	destroy?: ((state: T | undefined, ctx: Context, error?: unknown) => PromiseLike<void> | void) | null,
	options?: Service.Options,
): StateService<T>;
function stateService<T>(
	init: (ctx: Context) => T,
	destroy?: ((state: T | undefined, ctx: Context, error?: unknown) => PromiseLike<void> | void) | null,
	exec?: ((state: T, ctx: Context) => any) | null,
	options?: Service.Options,
): StateService<T>;
function stateService<T>(
	init: (ctx: Context) => T,
	destroy?: ((state: T | undefined, ctx: Context, error?: unknown) => PromiseLike<void> | void) | Service.Options | null,
	exec?: ((state: T, ctx: Context) => any) | Service.Options | null,
	options?: Service.Options,
): StateService<T> {
	const service: StateService<T> = function (ctx) {
		const state = init(ctx) || {} as T;
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
