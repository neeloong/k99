import {
	MaybePromise,
	Service,
	ServiceContext,
	ServiceDestroyContext,
	ServiceExecContext,
} from './types';


function service<T, D extends object, P extends any[]>(
	exec: (ctx: ServiceExecContext<D>, ...p: P) => T,
	destroy?: ((ctx: ServiceDestroyContext<D>) => MaybePromise<void>) | undefined | null,
): Service<T, D, P> {
	return function(ctx: ServiceContext<D>, ...any: any[]): any {
		if (ctx.channel === 'exec') {
			return exec(ctx, ...any as P);
		}
		if (ctx.channel === 'destroy') {
			if (typeof destroy === 'function') {
				return destroy(ctx);
			}
		}
	};
}
export default service;
