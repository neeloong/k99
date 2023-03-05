import K99Request from './types/K99Request';
import Setting from './types/Setting';
import Handler from './types/handle';
import { Context } from './types/context';
import Asset from './types/Asset';
import Log from './types/Log';
import initSettings from './utils/initSettings';
import initAssets from './utils/initAssets';
import initLog from './utils/initLog';
import main from './main';


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
	const asset = initAssets(options?.asset);
	const setting = initSettings(options?.setting);
	const log = initLog(options?.log);
	const get = async (c: Context, s: (v: any) => void) => getHandler(c, s);
	return (r: K99Request) => main(r, get, setting, asset, log);
}
