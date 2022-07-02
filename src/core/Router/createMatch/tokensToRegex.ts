import { Token } from './toTokens';

export function escapeString(str: string) {
	return decodeURIComponent(str).replace(/([.+*?=^!:${}()[\]|\\])/g, '\\$1');
}

function createSetFn(
	name: string,
	prefix: string,
	pattern: string,
	suffix: string,
	modifier: string,
): (p: Record<string, any>, s: string) => void {
	if (!['*', '+'].includes(modifier)) {
		return (p, s) => p[name] = decodeURIComponent(s);
	}
	return (p, s) => {
		const list: string[] = p[name] = [];
		const regex = new RegExp(`${ prefix }(${ pattern })${ suffix }`, 'g');
		let result: RegExpExecArray | null = null;
		// eslint-disable-next-line no-cond-assign
		while (result = regex.exec(s)) {
			if (!result[0]) { break; }
			list.push(decodeURIComponent(result[1]));
		}
	};
}
const defaultPattern = '[^/]+?';

function tokenToFragment(
	token: Token,
	setFns: ((p: Record<string, any>, s: string) => void)[],
): string {
	if (typeof token === 'string') { return escapeString(token); }

	const prefix = escapeString(token.prefix);
	const suffix = escapeString(token.suffix);
	const pattern = token.pattern || defaultPattern;
	const {name, modifier} = token;
	const regex = `(?:${ prefix }${ pattern }${ suffix })${ modifier }`;
	if (!name) { return regex; }
	setFns.push(createSetFn(name, prefix, pattern, suffix, modifier));
	return `(${ regex })`;
}

export default function tokensToRegex(
	paramsSetters: ((p: Record<string, any>, s: string) => void)[],
	tokens: Token[],
	end: boolean,
) {
	const tokenRegex = tokens.map(t => tokenToFragment(t, paramsSetters));
	tokenRegex.unshift('^');
	tokenRegex.push(end ? '$' : '(?=/|$)');
	return new RegExp(tokenRegex.join(''));
}
