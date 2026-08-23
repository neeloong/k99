import main from './main/index.mjs';
/** @import { FindHandler, Options } from './main/types' */

/**
 *
 * @param {FindHandler} getHandler
 * @param {Options} options
 * @returns {(request: Request & {remoteAddress?: string}) => Promise<Response | null>}
 */
export default function bind(getHandler, options) {
	return r => main(r, getHandler, options);
}
