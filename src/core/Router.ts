import type { Method, Handler, Guard } from './types';
export default abstract class Router {
	disabled = false;
	readonly plugin?: string;
	constructor(plugin?: string) {
		this.plugin = plugin;
	}

	abstract find(
		method: Method, path: string[],
	): Iterable<[Handler[] | Router, Record<string, any>, string[]]>;

	readonly guards = new Set<Guard>();
}
