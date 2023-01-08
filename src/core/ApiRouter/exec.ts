import type { Match } from '../types';

export default function exec(match: Match, path: string[], end: boolean) {
	if (!match.length) { return {}; }
	const params: Record<string, string | string[]> = {};
	for (let i = 0; i < match.length; i++) {
		const m = match[i];
		const p = path[i];
		if (m === p) { continue; }
		if (typeof m === 'string') { return; }
		if (!p) {
			if (!m.optional) { return; }
			return params;
		}
		if (!m.pattern.test(p)) { return; }
		params[m.name] = p;
	}
	if (!end) { return params; }
	const last = match[match.length - 1];
	if (typeof last === 'string') { return; }
	if (!last.many && path.length > match.length) { return; }
	for (let j = match.length; j < path.length; j++) {
		if (!last.pattern.test(path[j])) { return; }
	}
	params[last.name] = path.slice(match.length - 1);
	return params;

}
