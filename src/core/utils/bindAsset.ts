import type { Asset } from '../types';
import type Plugin from '../Plugin';


const idRegexText = '[a-zA-Z][a-zA-Z0-9_-]*';
const kRegexText = `${ idRegexText }(?:.${ idRegexText })*`;
const regexText = `^/(${ idRegexText })/((?:@${ kRegexText }/)?${ kRegexText })/(.+)$`;
const regex = new RegExp(regexText);


function bindAsset(
	api: Asset.Api, plugins?: Record<string, Plugin>, pluginPath?: string
): Asset.Api;
function bindAsset(
	api?: Asset.Api, plugins?: Record<string, Plugin>, pluginPath?: string
): Asset.Api | undefined;
function bindAsset(
	api?: Asset.Api, plugins?: Record<string, Plugin>, pluginPath = 'plugins'
): Asset.Api | undefined {
	const read = api?.read;
	if (typeof read !== 'function') { return api; }
	async function readApi(path: string) {
		const ret = await read!(path);
		if (ret !== null) { return ret; }
		if (!plugins) { return null; }
		const r = regex.exec(path);
		if (!r) { return null; }
		const [, base, name, subpath] = r;
		if (base !== pluginPath) { return null; }
		if (!(name in plugins)) { return null; }
		const plugin = plugins[name];
		if (!plugin) { return null; }
		return plugin.readAsset(subpath);
	}
	return {...api, read: readApi};
}
export default bindAsset;
