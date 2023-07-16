import type Setting from './types/Setting';
import type Asset from './types/Asset';
import type Log from './types/Log';
import type Environment from './types/Environment';
import initSettings from './utils/initSettings';
import initAssets from './utils/initAssets';
import initLog from './utils/initLog';
export default function createEnvironment(options?: {
	setting?: Setting.Api;
	asset?: Asset.Api;
	log?: Log.Api;
	error?: (e: unknown) => void
}): Environment {
	const asset = initAssets(options?.asset);
	const setting = initSettings(options?.setting);
	const log = initLog(options?.log);
	return {
		asset,
		setting,
		log,
		error: options?.error || (e => { log.error(e); }),
	};
}
