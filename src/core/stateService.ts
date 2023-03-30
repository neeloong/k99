import { Service, ServiceContext } from './types/context';


function stateService<T>(
	init: (ctx: ServiceContext<void, false>) => T,
	options?: Service.Options,
): Service<T, T, []>;
function stateService<T>(
	init: (ctx: ServiceContext<void, false>) => T,
	destroy?: ((state: T | undefined, ctx: ServiceContext<T, true>) => PromiseLike<void> | void) | null,
	options?: Service.Options,
): Service<T, T, []>;
function stateService<T>(
	init: (ctx: ServiceContext<void, false>) => T,
	destroy?: ((state: T | undefined, ctx: ServiceContext<T, true>) => PromiseLike<void> | void) | null,
	exec?: ((state: T, ctx: ServiceContext<T, false>) => any) | null,
	options?: Service.Options,
): Service<T, T, []>;
function stateService<T>(
	init: (ctx: ServiceContext<void, false>) => T,
	destroy?: ((state: T | undefined, ctx: ServiceContext<T, true>) => PromiseLike<void> | void) | Service.Options | null,
	exec?: ((state: T, ctx: ServiceContext<T, false>) => any) | Service.Options | null,
	options?: Service.Options,
): Service<T, T, []> {
	const service: Service<T, T, []> = function(
		ctx: ServiceContext<T>
	): any {
		if (ctx.currentService !== service) {
			return ctx.service(service);
		}
		if (!ctx.destroying) {
			let {state} = ctx;
			if (!state) {
				state = init(ctx as ServiceContext<void, false>) || {} as T;
				ctx.state = state;
			}
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
export default stateService;
