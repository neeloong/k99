import { Setting } from '../types';
import Plugin from '../Plugin';
import extendsInterface from './extendsInterface';
import getPluginPath from './getPluginPath';

async function defaultRead() { return undefined; }
async function defaultWrite() { return false; }
export default function initSettings(
	{ read = defaultRead, write = defaultWrite }: Setting.Api = {},
	plugins: Record<string, Plugin>,
): Setting {
	async function readSetting(path: string) {
		const ret = await read(path);
		if (ret) { return ret; }
		const p = getPluginPath(path, plugins);
		if (!p) { return null; }
		const [plugin, pluginPath] = p;
		return plugin.readSettings(pluginPath);
	}
	async function writeSetting(path: string, cfg?: object | null | undefined) {
		return write(path, cfg);
	}
	return extendsInterface({ read: readSetting, write: writeSetting}, {});
}
