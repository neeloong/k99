import type { FindHandler, Options } from './main';
import main from './main';


export default function make(
	getHandler: FindHandler,
	options?: Options,
) {
	return (r: Request) => main(r, getHandler, options);
}
