import { Match, Pattern } from '../types';
const regex = /^:([a-zA-Z][a-zA-Z0-9]*)(?:\((.+)\))?([iu])?([?+*]?)$/;
function parse(p: string): Pattern | string {
	const res = regex.exec(p);
	if (!res) { return p; }
	const [, name, expression, flags, modifier] = res;
	let i = 0;
	let count = 0;
	const pattern: string[] = ['^'];
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
	pattern.push('$');
	return {
		name,
		optional: modifier === '?' || modifier === '*',
		many: modifier === '+' || modifier === '*',
		pattern: new RegExp(pattern.join(''), flags),
	};

}

export default function toMatch(
	path: string,
	end: boolean,
): Match {
	const list: Match = [];
	for (const p of path.split('/')) {
		if (!p) { continue; }
		if (/^\.+$/.test(p)) { continue; }
		list.push(parse(p));
	}
	return list;
}
