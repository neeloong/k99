import type { Handler } from './types/handle';
import type { Context } from './types/context';
import main from './main';
import type { Options } from './types/Options';


export default function make(
	getHandler: (
		ctx: Context,
		setParams: (v: any) => void
	) => Promise<Handler | null> | Handler | null,
	options?: Options
) {
	return (r: Request) => main(r, getHandler, options);
}
