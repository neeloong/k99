/**
 * @callback Packer
 * @param {import('./main/types').Handler} handler
 * @returns {import('./main/types').Handler}
 */
/** @type {Packer} */
const noop = h => h;
/**
 *
 * @param {import('./onionskin.mjs').Onionskin} onionskin
 * @param {Packer} [packer]
 * @returns {Packer}
 */
export default function packer(onionskin, packer = noop) {
	return h => {
		const handler = packer(h)
		return async (ctx) => onionskin(ctx, async () => handler(ctx));
	};
}
