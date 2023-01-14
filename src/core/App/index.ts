import type {
	Asset,
	Log,
	Setting,
	K99Request,
	K99Response,
} from '../types';
import type Plugin from '../Plugin';
import Router from '../Router';
import run from '../run';

import initSettings from './initSettings';
import initAssets from './initAssets';
import find from './find';

class App {
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
		this.setting = initSettings(setting, plugins);
		this.asset = initAssets(asset, plugins);
		this.log = log;

		this.plugins = plugins;
		for (const plugin of Object.values(plugins)) {
			this.#routers.push(plugin.router);
		}
		if (router instanceof Router) {
			this.#routers.push(router);
		}
	}
	readonly #routers: Router[] = [];
	route(router: Router): Router {
		this.#routers.push(router);
		return router;
	}
	request(request: K99Request): Promise<null | K99Response> {
		const {setting, asset, log } = this;
		const routers = this.#routers;
		return run(request, {
			setting,
			asset,
			log,
			getHandlers: (ctx, setParams) => {
				const path = ctx.pathname.split('/').filter(Boolean);
				return find(
					routers.map(router => [router, {}, path]),
					ctx,
					setParams,
					{}
				); },
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
