import type K99Request from './types/K99Request';
import type Setting from './types/Setting';
import type Handler from './types/handle';
import type { Context } from './types/context';
import type Asset from './types/Asset';
import type Log from './types/Log';
import main from './main';
import createEnvironment from './createEnvironment';


export default function make(
	getHandler: (
		ctx: Context,
		setParams: (v: any) => void
	) => Promise<Handler | null> | Handler | null,
	options?: {
		setting?: Setting.Api;
		asset?: Asset.Api;
		log?: Log.Api;
	}
) {
	const environment = createEnvironment(options);
	return (r: K99Request) => main(r, getHandler, environment);
}
