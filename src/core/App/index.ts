import type {
	Asset,
	K99Request,
	K99Response,
	Log,
	Setting,
} from '../types';

import ApiRouter from '../ApiRouter';
import Router from '../Router';
import type Plugin from '../Plugin';
import run from '../run';

import initSettings from './initSettings';
import initAssets from './initAssets';
import find from './find';

class App extends ApiRouter {
	/** 设置接口 */
	readonly setting?: Setting.Api;
	/** 资产接口 */
	readonly asset?: Asset.Api;
	/** 日志接口 */
	readonly log?: Log.Api;
	readonly plugins: Record<string, Plugin>;
	constructor(
		{router, setting, asset, log }: App.Options = {},
		plugins: Record<string, Plugin> = {},
	) {
		super();

		this.setting = initSettings(setting, plugins);
		this.asset = initAssets(asset, plugins);
		this.log = log;

		this.plugins = plugins;
		for (const plugin of Object.values(plugins)) {
			this.route(plugin.router);
		}
		if (router instanceof Router) {
			this.route(router);
		}
	}
	request(request: K99Request): Promise<null | K99Response> {
		const {setting, asset, log } = this;
		return run(request, {
			setting,
			asset,
			log,
			getHandlers: (ctx, s) => find(
				this,
				ctx.method,
				ctx.pathname.split('/').filter(Boolean),
				ctx,
				s,
				{}
			),
		});
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
