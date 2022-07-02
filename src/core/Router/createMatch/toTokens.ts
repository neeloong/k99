import { CHAR, CLOSE, ESCAPED_CHAR, LexToken, LexTokenType, MODIFIER, NAME, OPEN, PATTERN } from './lexer';
const prefixes = '-/.:';

export interface Key {
	name?: string;
	prefix: string;
	suffix: string;
	pattern?: string;
	modifier: string;
}
export type Token = string | Key;


function throwError([type, index, value]: LexToken): never {
	switch (type) {
		case OPEN:
		case CLOSE:
			throw new TypeError(`Unexpected token '${ type }' at ${ index }`);
		case PATTERN:
			throw new TypeError(`Unexpected pattern '(${ value })' at ${ index }`);
		case NAME:
			throw new TypeError(`Unexpected name ':${ value }' at ${ index }`);
		case CHAR:
			throw new TypeError(`Unexpected char '${ value }' at ${ index }`);
		case ESCAPED_CHAR:
			throw new TypeError(`Unexpected char '\\' at ${ index }`);
		case MODIFIER:
			throw new TypeError(`Unexpected token '${ value }' at ${ index }`);
	}
}

function throwUnexpectedError(): never {
	throw new TypeError('Unexpected end of input');
}
export default function *toTokens(tokens: LexToken[]): Iterable<Token> {
	let i = 0;

	function get(type: LexTokenType): string | undefined {
		const token = tokens[i];
		if (!token) { return undefined; }
		const [nextType, , value] = token;
		if (nextType !== type) { return undefined; }
		i++;
		return value;
	}

	function getText(): string {
		let result = '';
		for (let token = tokens[i]; token; token = tokens[++i]) {
			const [type, , value] = token;
			if (CHAR === type) {
				result += value;
			} else if (ESCAPED_CHAR === type) {
				result += value;
			} else {
				break;
			}
		}
		return result;
	}

	const path: string[] = [];
	while (i < tokens.length) {
		const char = get(CHAR) || '';
		const escaped = !char && get(ESCAPED_CHAR) || '';
		const modifier = get(MODIFIER) || '';
		if ((char || escaped) && modifier) {
			yield {
				prefix: char || escaped,
				suffix: '',
				pattern: undefined,
				modifier,
			};
			continue;

		}
		const name = get(NAME);
		const pattern = get(PATTERN);

		if (name || pattern) {
			let prefix = '';
			const c = char || modifier;
			if (c && prefixes.includes(c)) {
				prefix = c;
			} else if (c) {
				path.push(c);
			} else if (escaped) {
				path.push(escaped);
			}
			if (path.length) {
				yield path.join('');
				path.length = 0;
			}
			const groupModifier = get(MODIFIER) || '';

			yield {
				prefix,
				name,
				suffix: '',
				pattern,
				modifier: groupModifier,
			};
			continue;
		}

		const value = char || escaped || modifier;
		if (value) {
			if (value !== '/') {
				path.push(value);
				continue;
			}
			if (path.length) {
				yield path.join('');
				path.length = 0;
			}
			yield '/';
			continue;
		}
		if (path.length) {
			yield path.join('');
			path.length = 0;
		}


		const openToken = tokens[i++];
		if (!openToken) { break; }
		if (openToken[0] !== OPEN) { throwError(openToken); }

		const prefix = getText();
		const groupName = get(NAME) || '';
		const groupPattern = get(PATTERN);
		const suffix = getText();

		const closeToken = tokens[i++];
		if (!closeToken) { throwUnexpectedError(); }
		if (closeToken[0] !== CLOSE) { throwError(closeToken); }

		const groupModifier = get(MODIFIER) || '';
		yield {
			prefix,
			name: groupName,
			pattern: groupPattern,
			suffix,
			modifier: groupModifier,
		};
	}

	if (path.length) {
		yield path.join('');
	}
}
