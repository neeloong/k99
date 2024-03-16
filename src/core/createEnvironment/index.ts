import type { Environment } from './Environment';
import initSettings from './initSettings';
import initAssets from './initAssets';
import initLog from './initLog';
export default function createEnvironment(options?: {
	setting?: Environment.Setting.Api;
	asset?: Environment.Asset.Api;
	log?: Environment.Log.Api;
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
export type { Environment } from './Environment';
