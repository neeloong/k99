import { Service, ServiceContext } from './types/context';


function service<T, D extends object, P extends any[]>(
	exec: (ctx: ServiceContext<D, false>, ...p: P) => T,
	destroy?: ((ctx: ServiceContext<D, true>) => PromiseLike<void> | void) | undefined | null,
): Service<T, D, P> {
	return function(ctx: ServiceContext<D>, ...any: any[]): any {
		if (!ctx.destroying) {
			return exec(ctx as ServiceContext<D, false>, ...any as P);
		}
		if (typeof destroy === 'function') {
			return destroy(ctx as ServiceContext<D, true>);
		}
	};
}
export default service;
