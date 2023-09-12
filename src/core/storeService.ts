import type { Service, ServiceContext, StoreService } from './types/context';


function storeService<T>(
	options?: Service.Options,
): StoreService<T>;
function storeService<T>(
	destroy?: ((state: T | undefined, ctx: ServiceContext<T, true>) => PromiseLike<void> | void) | null,
	options?: Service.Options,
): StoreService<T>;
function storeService<T>(
	destroy?: ((state: T | undefined, ctx: ServiceContext<T, true>) => PromiseLike<void> | void) | null,
	exec?: ((state: T | undefined, ctx: ServiceContext<T, false>) => any) | null,
	options?: Service.Options,
): StoreService<T>;
function storeService<T>(
	destroy?: ((state: T | undefined, ctx: ServiceContext<T, true>) => PromiseLike<void> | void) | Service.Options | null,
	exec?: ((state: T | undefined, ctx: ServiceContext<T, false>) => any) | Service.Options | null,
	options?: Service.Options,
): StoreService<T> {
	const service: StoreService<T> = function(
		ctx: ServiceContext<T>,
		...s: [s?: T]
	): any {
		if (ctx.currentService !== service) {
			return ctx.service(service, ...s);
		}
		if (!ctx.destroying) {
			if (!s.length) {
				return ctx.state;
			}
			const [state] = s;
			ctx.state = state;
			if (typeof exec === 'function') {
				exec(state, ctx as ServiceContext<T, false>);
			}
			return state;
		}
		if (typeof destroy === 'function') {
			return destroy(ctx.state, ctx as ServiceContext<T, true>);
		}
	};
	const {
		rootOnly,
	} = typeof destroy === 'object' && destroy
		|| typeof exec === 'object' && exec
		|| typeof options === 'object' && options
		|| {};
	Object.assign(service, {rootOnly: Boolean(rootOnly)});
	return service;
}
export default storeService;
