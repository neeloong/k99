import type Setting from '../types/Setting';

async function defaultRead() { return undefined; }
async function defaultWrite() { return false; }
export default function initSettings(
	{ read = defaultRead, write = defaultWrite }: Setting.Api = {},
): Setting {
	return { read, write};
}
