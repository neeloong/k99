import { Service, ServiceContext } from './types/context';


function stateService<T extends object>(
	init: (ctx: ServiceContext<void, false>) => T,
	destroy?: ((state: T, ctx: ServiceContext<T, true>) => PromiseLike<void> | void) | undefined | null,
	exec?: (state: T, ctx: ServiceContext<T, false>) => any,
): Service<T, T, []> {
	return function(ctx: ServiceContext<T>): any {
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
			const {state} = ctx;
			if (!state) { return; }
			return destroy(state, ctx as ServiceContext<T, true>);
		}
	};
}
export default stateService;
