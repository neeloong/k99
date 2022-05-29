/** 花括号开 */
export const OPEN = '{';
/** 花括号关 */
export const CLOSE = '}';
/** 正则匹配 */
export const PATTERN = 3;
/** 名字 */
export const NAME = 4;
/** 普通字符 */
export const CHAR = 5;
/** 转义字符 */
export const ESCAPED_CHAR = 6;
/** 数量修饰符 */
export const MODIFIER = 7;

export type LexTokenType = '{' | '}' | 3 | 4 | 5 | 6 | 7;

export type LexToken = [LexTokenType, number, string];

function getType(char: string): LexTokenType {
	if (char === '{') { return OPEN; }
	if (char === '}') { return CLOSE; }
	if (char === '*' || char === '+' || char === '?') { return MODIFIER; }
	return CHAR;
}
function isNameChar(c: string): boolean {
	return '0' <= c && c <= '9'
	|| 'a' <= c && c <= 'z'
	|| 'A' <= c && c <= 'Z'
	|| c === '_';
}

export default function *lexer(str: string): Iterable<LexToken> {
	let i = 0;

	while (i < str.length) {
		const index = i;
		const char = str[i++];

		if (char === '\\') {
			const ch = str[i++];
			yield [ESCAPED_CHAR, index, ch];
			continue;
		}
		if (char === ':') {
			for (; i < str.length; i++) {
				if (!isNameChar(str[i])) { break; }
			}
			if (index + 1 === i) {
				yield [CHAR, i, char];
				continue;
			}
			yield [NAME, index, str.substring(index + 1, i)];
			continue;
		}
		if (char !== '(') {
			yield [getType(char), index, char];
			continue;
		}

		if (str[i] === '?') {
			throw new TypeError(`Pattern cannot start with "?" at ${ i }`);
		}
		let count = 1;
		const pattern: string[] = ['(?:'];
		while (i < str.length) {
			const c = str[i++];
			pattern.push(c);
			if (c === '\\') {
				pattern.push(str[i++]);
				continue;
			}
			if (c === ')') {
				count--;
				if (count === 0) { break; }
				continue;
			}
			if (c === '[') {
				while (i < str.length) {
					const c = str[i++];
					pattern.push(c);
					if (c === ']') { break; }
					if (c !== '\\') { continue; }
					pattern.push(str[i++]);
				}
				continue;
			}
			if (c !== '(') { continue; }
			count++;
			pattern.push('?:');
			if (str[i] !== '?') { continue; }
			i += 2;
			if (str[i - 1] === ':') { continue; }
			throw new TypeError(`Invalid pattern group at ${ i - 2 }`);
		}

		if (count) { throw new TypeError(`Unterminated pattern at ${ index }`); }
		if (!pattern.length) { throw new TypeError(`Missing pattern at ${ index }`); }
		yield [PATTERN, index, pattern.join('')];
	}
}
