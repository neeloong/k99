import type K99Request from './types/K99Request';
import type K99Response from './types/K99Response';
import type Setting from './types/Setting';
import type Handler from './types/handle';
import type { Context } from './types/context';
import type Asset from './types/Asset';
import type Log from './types/Log';

import initSettings from './initSettings';
import initAssets from './initAssets';
import initLog from './initLog';
import main from './main';
import service from './service';

export type { default as K99Request } from './types/K99Request';
export type { default as K99Response } from './types/K99Response';
export type { default as Setting } from './types/Setting';
export type { default as Handler } from './types/handle';
export type { Context, Service, ServiceContext } from './types/context';
export type { default as Asset } from './types/Asset';
export type { default as Log } from './types/Log';
export type { default as WriteType } from './types/WriteType';
export type { default as Method } from './types/method';
export type { default as Encoding } from './types/Encoding';
export type { default as HexEncoding } from './types/HexEncoding';
export type { CookieClearOption, CookieOption, CookieOptionInfo } from './types/cookie';
export type { default as K99Headers } from './types/K99Headers';
export type { default as ActionContext } from './types/ActionContext';

function k99(
	req: K99Request,
	getHandlers: (
		ctx: Context,
		setParams: (v: any) => void,
	) => Promise<Handler[] | null> | Handler[] | null,
	options?: {
		setting?: Setting.Api,
		asset?: Asset.Api,
		log?: Log.Api,
	},
): Promise<K99Response | null> {
	const asset = initAssets(options?.asset);
	const setting = initSettings(options?.setting);
	const log = initLog(options?.log);
	const get = async (c: Context, s: (v: any) => void) => getHandlers(c, s);
	return main(req, get, setting, asset, log);
}

k99.service = service;
k99.make = function (
	getHandlers: (
		ctx: Context,
		setParams: (v: any) => void,
	) => Promise<Handler[] | null> | Handler[] | null,
	options?: {
		setting?: Setting.Api,
		asset?: Asset.Api,
		log?: Log.Api,
	},
) {
	const asset = initAssets(options?.asset);
	const setting = initSettings(options?.setting);
	const log = initLog(options?.log);
	const get = async (c: Context, s: (v: any) => void) => getHandlers(c, s);
	return (r: K99Request) => main(r, get, setting, asset, log);
};

export default k99;
