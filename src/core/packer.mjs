/** @import { Handler } from './main/types' */
/** @import { Onionskin } from './onionskin.mjs' */
/**
 * @callback Packer
 * @param {Handler} handler
 * @returns {Handler}
 */
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
		return async (ctx) => onionskin(ctx, async () => handler(ctx));
	};
}
