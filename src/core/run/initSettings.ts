import type { Setting } from '../types';

import extendsInterface from './extendsInterface';

async function defaultRead() { return undefined; }
async function defaultWrite() { return false; }
export default function initSettings(
	{ read = defaultRead, write = defaultWrite }: Setting.Api = {},
): Setting {
	return extendsInterface({ read, write}, {});
}
