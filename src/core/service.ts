import type { Service, ServiceContext } from './types/context';


function service<T, D, P extends any[]>(
	exec: (ctx: ServiceContext<D, false>, ...p: P) => T,
	destroy?: ((ctx: ServiceContext<D, true>) => PromiseLike<void> | void) | null,
	options?: Service.Options,
): Service<T, D, P>;
function service<T, D, P extends any[]>(
	exec: (ctx: ServiceContext<D, false>, ...p: P) => T,
	options?: Service.Options,
): Service<T, D, P>;
function service<T, D, P extends any[]>(
	exec: (ctx: ServiceContext<D, false>, ...p: P) => T,
	destroy?: ((ctx: ServiceContext<D, true>) => PromiseLike<void> | void) | Service.Options | null,
	options?: Service.Options,
): Service<T, D, P> {
	const service: Service<T, D, P> = function(
		ctx: ServiceContext<D>,
		...any: any[]
	): any {
		if (ctx.currentService !== service) {
			return ctx.service(service, ...any as P);
		}
		if (!ctx.destroying) {
			return exec(ctx as ServiceContext<D, false>, ...any as P);
		}
		if (typeof destroy === 'function') {
			return destroy(ctx as ServiceContext<D, true>);
		}
	};
	const {
		rootOnly,
	} = typeof destroy === 'object' && destroy
		|| typeof options === 'object' && options
		|| {};
	Object.assign(service, {rootOnly: Boolean(rootOnly)});
	return service;
}
export default service;
