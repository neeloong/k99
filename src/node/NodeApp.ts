import * as pathFn from 'node:path';
import type {
	Asset,
	K99Request,
	K99Response,
	Log,
	Plugin,
	Setting,
} from 'k99';
import { Router, bindAsset } from 'k99';
import createFsLogApi from './createFsLogApi';
import createFsSettingsApi from './createFsSettingsApi';
import createFsAssetsApi from './createFsAssetsApi';

class NodeApp {
	readonly cwd: string;
	readonly settingsPath: string;
	readonly assetsPath: string;
	readonly logsPath: string;
	readonly setting: Setting.Api;
	readonly asset: Asset.Api;
	readonly log: Log.Api;
	readonly plugins: Record<string, Plugin>;
	readonly routers: Router[] = [];
	readonly run: (request: K99Request) => Promise<null | K99Response>;
	constructor({
		path, settingPath, assetPath, logPath, router,
	}: NodeApp.Options = {},
	plugins: Record<string, Plugin> = {}) {
		const cwd = pathFn.resolve(path || process.cwd());
		const newSettingsPath = pathFn.resolve(cwd, settingPath || 'settings');
		const newAssetsPath   = pathFn.resolve(cwd, assetPath   || 'assets');
		const newLogsPath     = pathFn.resolve(cwd, logPath     || 'logs');


		const setting = createFsSettingsApi(newSettingsPath);
		const asset = bindAsset(createFsAssetsApi(newAssetsPath));
		const log = createFsLogApi(newLogsPath);
		this.cwd = cwd;
		this.settingsPath = newSettingsPath;
		this.assetsPath = newAssetsPath;
		this.logsPath = newLogsPath;

		this.setting = setting;
		this.asset = asset;
		this.log = log;

		this.plugins = plugins;
		const {routers} = this;
		for (const plugin of Object.values(plugins)) {
			routers.push(plugin.router);
		}
		if (router instanceof Router) {
			routers.push(router);
		}
		this.run = Router.make({setting, asset, log}, routers);
	}
}

declare namespace NodeApp {
	export interface Options {
		/** 工作路径 */
		path?: string;
		/** assets 路径 */
		assetPath?: string;
		/** 设置路径 */
		settingPath?: string;
		/** 日志路径，仅入口有效 */
		logPath?: string;
		router?: Router;
	}

}
export default NodeApp;
