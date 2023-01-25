import type { Asset, Log, Setting, K99Request, K99Response } from 'k99';
import run from 'k99';
import Plugin from 'k99/plugin';
import Router from 'k99/router';

class App {
	/** 设置接口 */
	readonly setting?: Setting.Api;
	/** 资产接口 */
	readonly asset?: Asset.Api;
	/** 日志接口 */
	readonly log?: Log.Api;
	readonly plugins: Record<string, Plugin>;
	readonly routers: Router[] = [];
	readonly run: (request: K99Request) => Promise<null | K99Response>;
	constructor(
		{router, setting, asset, log }: App.Options = {},
		plugins: Record<string, Plugin> = {},
	) {
		this.setting = setting;
		this.asset = Plugin.bindAsset(asset, plugins);
		this.log = log;

		this.plugins = plugins;
		const {routers} = this;
		for (const plugin of Object.values(plugins)) {
			routers.push(plugin.router);
		}
		if (router instanceof Router) {
			routers.push(router);
		}
		this.run = run.make(Router.make(routers), this);
	}
}
declare namespace App {
	export interface Options {
		router?: Router;
		asset?: Asset.Api;
		setting?: Setting.Api;
		log?: Log.Api;
	}
}

export default App;
