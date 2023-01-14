import type { Setting } from '../types';
import type Plugin from '../Plugin';

import getPluginPath from './getPluginPath';

export default function initSettings(
	api?: Setting.Api, plugins?: Record<string, Plugin>,
): Setting.Api | undefined {
	const read = api?.read;
	if (typeof read !== 'function') { return api; }
	async function readApi(path: string) {
		const ret = await read!(path);
		if (ret) { return ret; }
		const p = getPluginPath(path, plugins);
		if (!p) { return null; }
		const [plugin, pluginPath] = p;
		return plugin.readSettings(pluginPath);
	}
	return {...api, read: readApi};
}
