import type Plugin from '../Plugin';

const idRegexText = '[a-zA-Z][a-zA-Z0-9_-]*';
const kRegexText = `${ idRegexText }(?:.${ idRegexText })*`;
const regexText = `^/plugins/((?:@${ kRegexText }/)?${ kRegexText })/(.+)$`;
const regex = new RegExp(regexText);

export default function getPluginPath(
	path: string,
	plugins?: Record<string, Plugin>
): [Plugin, string] | null {
	if (!plugins) { return null; }
	const r = regex.exec(path);
	if (!r) { return null; }
	const [, name, subpath] = r;
	if (!(name in plugins)) { return null; }
	const plugin = plugins[name];
	if (!plugin) { return null; }
	return [plugin, subpath];
}
