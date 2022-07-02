import { Context } from './context';
import { MaybePromise } from './promise';

export interface Guard {
	(ctx: Context): MaybePromise<boolean>;
}
