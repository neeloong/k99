import type { Asset } from '../types';
import type Plugin from '../Plugin';

import getPluginPath from './getPluginPath';

export default function initAssets(
	api?: Asset.Api, plugins?: Record<string, Plugin>
): Asset.Api | undefined {
	const read = api?.read;
	if (typeof read !== 'function') { return api; }
	async function readApi(path: string) {
		const ret = await read!(path);
		if (ret !== null) { return ret; }
		const p = getPluginPath(path, plugins);
		if (!p) { return null; }
		const [plugin, pluginPath] = p;
		return plugin.readAsset(pluginPath);
	}
	return {...api, read: readApi};
}
