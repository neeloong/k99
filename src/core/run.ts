import type K99Request from './types/K99Request';
import type K99Response from './types/K99Response';
import type Setting from './types/Setting';
import type Handler from './types/handle';
import type { Context } from './types/context';
import type Asset from './types/Asset';
import type Log from './types/Log';

import main from './main';
import createEnvironment from './createEnvironment';

export default function run(
	req: K99Request,
	getHandler: (
		ctx: Context,
		setParams: (v: any) => void,
	) => Promise<Handler | null> | Handler | null,
	options?: {
		setting?: Setting.Api,
		asset?: Asset.Api,
		log?: Log.Api,
	},
): Promise<K99Response | null> {
	const environment = createEnvironment(options);
	return main(req, getHandler, environment);
}
