import type {
	Asset,
	K99Request,
	K99Response,
	Log,
	Setting,
} from '../types';

import Router from '../Router';
import type Plugin from '../Plugin';

import callback from './callback';
import initLog from './initLog';
import initSettings from './initSettings';
import initAssets from './initAssets';


class App extends Router {
	/** 设置接口 */
	readonly setting: Setting;
	/** 资产接口 */
	readonly asset: Asset;
	/** 日志接口 */
	readonly log: Log;
	readonly plugins: Record<string, Plugin>;
	constructor(
		{router, setting, asset, log, path }: App.Options = {},
		plugins: Record<string, Plugin> = {},
	) {
		super(path);

		this.setting = initSettings(setting, plugins);
		this.asset = initAssets(asset, plugins);
		this.log = initLog(log);

		this.plugins = plugins;
		for (const plugin of Object.values(plugins)) {
			this.route(plugin.router);
		}
		if (router instanceof Router) {
			this.route(router);
		}
	}
	request(request: K99Request): Promise<null | K99Response> {
		return callback(this, request);
	}
}
declare namespace App {
	export interface Options {
		path?: string;
		router?: Router;
		asset?: Asset.Api;
		setting?: Setting.Api;
		log?: Log.Api;
	}
}

export default App;
