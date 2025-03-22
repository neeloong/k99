/** @import { Match } from './index.mjs' */
/**
 * @typedef {object} Pattern
 * @property {string} name
 * @property {boolean} optional
 * @property {boolean} many
 * @property {RegExp} pattern
 */

const regex = /^:([a-zA-Z][a-zA-Z0-9]*)(?:\((.+)\))?([ius]+)?([?+*]?)$/;
/**
 *
 * @param {string} p
 * @returns {Pattern | string}
 */
function parse(p) {
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
	/** @type {string[]} */
	const pattern = ['^(?:'];
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
/**
 *
 * @param {(Pattern | string)[]} match
 * @param {string[]} path
 * @param {boolean} end
 * @returns {[Record<string, string | string[]>, string[]] | undefined}
 */
function exec(match, path, end) {
	/** @type {Record<string, string | string[]>} */
	const params = {};
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
/**
 *
 * @param {string} path
 * @param {boolean} end
 * @returns {Match | undefined}
 */
export default function toMatch(path, end) {
	/** @type {(Pattern | string)[]} */
	const list = [];
	for (const p of path.split('/')) {
		if (!p || /^\.+$/.test(p)) { continue; }
		list.push(parse(p));
	}
	if (!list.length) { return; }
	return path => exec(list, path, end);
}
