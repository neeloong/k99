import type K99Request from './types/K99Request';
import type K99Response from './types/K99Response';
import type Setting from './types/Setting';
import type Handler from './types/handle';
import type { Context } from './types/context';
import type Asset from './types/Asset';
import type Log from './types/Log';

import initSettings from './utils/initSettings';
import initAssets from './utils/initAssets';
import initLog from './utils/initLog';
import main from './main';

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
	const asset = initAssets(options?.asset);
	const setting = initSettings(options?.setting);
	const log = initLog(options?.log);
	const get = async (c: Context, s: (v: any) => void) => getHandler(c, s);
	return main(req, get, setting, asset, log);
}
