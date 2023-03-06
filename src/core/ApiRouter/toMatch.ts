export interface Match {
	(paths: string[]): [Record<string, string | string[]>, string[]] | undefined;
}

interface Pattern {
	name: string;
	optional: boolean;
	many: boolean;
	pattern: RegExp;
}

const regex = /^:([a-zA-Z][a-zA-Z0-9]*)(?:\((.+)\))?([ius]+)?([?+*]?)$/;
function parse(p: string): Pattern | string {
	const res = regex.exec(p);
	if (!res) { return p; }
	const [, name, expression = '.*', flags, modifier] = res;
	if (!expression) {
		return {
			name, pattern: new RegExp('^.*$', flags),
			optional: modifier === '?' || modifier === '*',
			many: modifier === '+' || modifier === '*',
		};
	}
	let i = 0;
	let count = 0;
	const pattern: string[] = ['^(?:'];
	while (i < expression.length) {
		const c = expression[i++];
		pattern.push(c);
		if (c === '\\') {
			pattern.push(expression[i++]);
			continue;
		}
		if (c === ')') {
			if (count === 0) { return p; }
			count--;
			continue;
		}
		if (c === '[') {
			while (i < expression.length) {
				const c = expression[i++];
				pattern.push(c);
				if (c === ']') { break; }
				if (c !== '\\') { continue; }
				pattern.push(expression[i++]);
			}
			continue;
		}
		if (c !== '(') { continue; }
		count++;
		if (expression[i] !== '?') { continue; }
		i += 2;
		if (expression[i - 1] === ':') { continue; }
		return p;
	}
	if (count) { return p; }
	pattern.push(')$');
	return {
		name, pattern: new RegExp(pattern.join(''), flags),
		optional: modifier === '?' || modifier === '*',
		many: modifier === '+' || modifier === '*',
	};

}
function exec(
	match: (Pattern | string)[],
	path: string[],
	end: boolean
): [Record<string, string | string[]>, string[]] | undefined {
	const params: Record<string, string | string[]> = {};
	for (let i = 0; i < match.length; i++) {
		const m = match[i];
		const p = path[i];
		if (m === p) { continue; }
		if (typeof m === 'string') { return; }
		if (!p) { return m.optional ? [params, []] : undefined; }
		if (!m.pattern.test(p)) { return; }
		params[m.name] = p;
	}
	if (!end) { return [params, path.slice(match.length)]; }
	if (path.length <= match.length) { return [params, []]; }
	const last = match[match.length - 1];
	if (typeof last === 'string') { return; }
	if (!last.many && path.length > match.length) { return; }
	for (let j = match.length; j < path.length; j++) {
		if (!last.pattern.test(path[j])) { return; }
	}
	params[last.name] = path.slice(match.length - 1);
	return [params, []];

}
export default function toMatch(path: string, end: boolean): Match | undefined {
	const list: (Pattern | string)[] = [];
	for (const p of path.split('/')) {
		if (!p || /^\.+$/.test(p)) { continue; }
		list.push(parse(p));
	}
	if (!list.length) { return; }
	return path => exec(list, path, end);
}
