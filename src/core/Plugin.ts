import ApiRouter from './ApiRouter';
import Router from './Router';

export default abstract class Plugin {
	/** 包名 */
	readonly name: string;
	/** 版本 */
	readonly version: string;
	/** 作者 */
	readonly author: string;
	/** 开源协议 */
	readonly license: string;
	constructor(
		name: string,
		/** 版本 */
		version: string,
		{ author, license}: {
		/** 作者 */
			author?: string;
			/** 开源协议 */
			license?: string;
		} = {}
	) {
		this.name = name;
		this.version = typeof version === 'string' ? version : '';
		this.author = typeof author === 'string' ? author : '';
		this.license = typeof license === 'string' ? license : '';
	}

	abstract readSettings(path: string): any | Promise<any>;
	abstract readAsset(path: string): Promise<Uint8Array | null>;

	private __initRouterPromise: Promise<Router> | undefined;
	protected _initRouter(router: Router): Promise<void> | void {}
	initRouter() {
		const {router} = this;
		if (this.__initRouterPromise) {
			return this.__initRouterPromise;
		}
		return this.__initRouterPromise = Promise.resolve()
			.then(() => this._initRouter(router))
			.then(() => router);
	}
	get router() {
		const router = new ApiRouter();
		Reflect.defineProperty(this, 'router', {
			value: router,
			configurable: true,
		});
		this.initRouter();
		return router;
	}
	get disabled(): boolean {
		return this.router.disabled;
	}
	set disabled(t) {
		this.router.disabled = t;
	}
}
