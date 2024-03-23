import type { Service, Context } from './types/context';


function service<T, P extends any[]>(
	exec: (ctx: Context, ...p: P) => T,
	destroy?: ((ctx: Context, error?: unknown) => PromiseLike<void> | void) | null,
	options?: Service.Options,
): Service<T, P>;
function service<T, P extends any[]>(
	exec: (ctx: Context, ...p: P) => T,
	options?: Service.Options,
): Service<T, P>;
function service<T, P extends any[]>(
	exec: (ctx: Context, ...p: P) => T,
	destroy?: ((ctx: Context, error?: unknown) => PromiseLike<void> | void) | Service.Options | null,
	options?: Service.Options,
): Service<T, P> {
	const service: Service<T, P> = function (ctx): any {
		if (typeof destroy === 'function') {
			ctx.done(() => destroy(ctx), error => destroy(ctx, error));
		}
		return (...any: any[]) => exec(ctx, ...any as P);
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
