import * as pathFn from 'node:path';
import type { Router } from 'k99';
import { App } from 'k99';
import FsPlugin from './FsPlugin';
import createFsLogApi from './createFsLogApi';
import createFsSettingsApi from './createFsSettingsApi';
import createFsAssetsApi from './createFsAssetsApi';

class NodeApp extends App {
	readonly cwd: string;
	readonly settingsPath: string;
	readonly assetsPath: string;
	readonly logsPath: string;
	constructor({
		path, settingPath, assetPath, logPath, router,
	}: NodeApp.Options = {},
	plugins?: Record<string, FsPlugin>) {
		const cwd = pathFn.resolve(path || process.cwd());
		const newSettingsPath = pathFn.resolve(cwd, settingPath || 'settings');
		const newAssetsPath   = pathFn.resolve(cwd, assetPath   || 'assets');
		const newLogsPath     = pathFn.resolve(cwd, logPath     || 'logs');

		super({
			path: cwd,
			setting: createFsSettingsApi(newSettingsPath),
			asset: createFsAssetsApi(newAssetsPath),
			log: createFsLogApi(newLogsPath),
			router,
		}, plugins);
		this.cwd = cwd;
		this.settingsPath = newSettingsPath;
		this.assetsPath = newAssetsPath;
		this.logsPath = newLogsPath;
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
