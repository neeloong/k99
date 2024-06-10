async function defaultRead() { return undefined; }
async function defaultWrite() { return false; }
/**
 * 
 * @param {import('./index.ts').Setting.Api} [setting] 
 * @returns {import('./index.ts').Setting}
 */
export default function initSettings(
	{ read = defaultRead, write = defaultWrite } = {},
) {
	return { read, write };
}
