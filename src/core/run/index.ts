import type {
	K99Request,
	K99Response,
	Context,
	Asset,
	Handler,
	Log,
	Setting,
} from '../types';

import main from './main';
import initSettings from './initSettings';
import initAssets from './initAssets';
import initLog from './initLog';

export default function run(
	req: K99Request,
	options: {
		setting?: Setting.Api,
		asset?: Asset.Api,
		log?: Log.Api,
		getHandlers(
			ctx: Context,
			setParams: (v: any) => void,
		): Promise<Handler[] | null>,
	},
	parent?: Context,
): Promise<K99Response | null> {
	const {getHandlers} = options;
	const asset = initAssets(options.asset);
	const setting = initSettings(options.setting);
	const log = initLog(options.log);
	return main(req, setting, asset, log, getHandlers, parent);
}
