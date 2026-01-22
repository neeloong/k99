/** @import { Handler } from './main/types' */
/** @import { Onionskin } from './onionskin.mjs' */
/**
 * @callback Packer
 * @param {Handler | Handler[]} handler
 * @returns {Handler | Handler[]}
 */

import { runHandles } from './merge.mjs';

/** @type {Packer} */
const noop = h => h;
/**
 *
 * @param {Onionskin} onionskin
 * @param {Packer} [packer]
 * @returns {Packer}
 */
export default function packer(onionskin, packer = noop) {
	return h => {
		const handler = packer(h)
		return async (ctx) => onionskin(ctx, async () => runHandles(ctx, [handler].flat()));
	};
}
