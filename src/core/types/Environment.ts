import type { Asset } from './Asset';
import type { Log } from './Log';
import type { Setting } from './Setting';


export interface Environment {
	readonly setting?: Setting;
	readonly asset?: Asset;
	readonly log?: Log;
	error?(error: unknown): void;
}
