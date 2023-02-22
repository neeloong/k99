import { Service, ServiceContext } from './types/context';


function storeService<T>(
	destroy?: ((state: T | undefined, ctx: ServiceContext<T, true>) => PromiseLike<void> | void) | undefined | null,
	exec?: (state: T | undefined, ctx: ServiceContext<T, false>) => any,
): Service<T | undefined, T, [s?: T]> {
	return function(ctx: ServiceContext<T>, ...s: [s?: T]): any {
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
}
export default storeService;
