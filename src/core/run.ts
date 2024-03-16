import type { Setting } from './types/Setting';
import type { Handler } from './types/handle';
import type { Context } from './types/context';
import type { Asset } from './types/Asset';
import type { Log } from './types/Log';

import main from './main';
import createEnvironment from './createEnvironment';
import type { Runner } from './types/Runner';

export default function run(
	req: Request,
	getHandler: (
		ctx: Context,
		setParams: (v: any) => void,
	) => Promise<Handler | null> | Handler | null,
	options?: {
		setting?: Setting.Api,
		asset?: Asset.Api,
		log?: Log.Api,
		runner?: Runner,
		method?: string | ((request: Request) => string);
	},
): Promise<Response | null> {
	const environment = createEnvironment(options);
	return main(req, getHandler, environment, options);
}
