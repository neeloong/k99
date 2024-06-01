import type { Environment } from './Environment';

async function defaultRead() { return undefined; }
async function defaultWrite() { return false; }
export default function initSettings(
	{ read = defaultRead, write = defaultWrite }: Environment.Setting.Api = {},
): Environment.Setting {
	return { read, write };
}
