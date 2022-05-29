import { Key, Token } from './toTokens';

export function escapeString(str: string) {
	return decodeURIComponent(str).replace(/([.+*?=^!:${}()[\]|\\])/g, '\\$1');
}

function createSetFn(
	{name, modifier, suffix, prefix}: Key
): (p: Record<string, any>, s: string, k: number) => void {
	if (!['*', '+'].includes(modifier) || !prefix && !suffix) {
		if (typeof name === 'number') {
			return (p, s, k) => p[name + k] = decodeURIComponent(s);
		}
		return (p, s) => p[name] = decodeURIComponent(s);
	}
	const split = prefix + suffix;
	if (typeof name === 'number') {
		return (p, s, k) => {
			p[name + k] = s.split(split).map(value =>  decodeURIComponent(value));
		};
	}
	return (p, s) => {
		p[name] = s.split(split).map(value =>  decodeURIComponent(value));
	};
}
const defaultPattern = '[^/]+?';

function tokenToFragment(
	token: Token,
	setFns: ((p: Record<string, any>, s: string, key: number) => void)[],
): string {
	if (typeof token === 'string') { return escapeString(token); }

	const prefix = escapeString(token.prefix);
	const suffix = escapeString(token.suffix);
	const {name, modifier} = token;

	if (name === '') { return `(?:${ prefix }${ suffix })${ modifier }`; }

	setFns.push(createSetFn(token));
	const pattern = token.pattern || defaultPattern;
	if (!prefix && !suffix) {
		return `((?:${ pattern })${ modifier })`;
	}

	if (modifier === '?') {
		return `(?:${ prefix }(${ pattern })${ suffix })?`;
	}
	if (modifier === '+') {
		return `${ prefix }(${ pattern }(?:${ suffix }${ prefix }${ pattern })*)${ suffix }`;
	}
	if (modifier === '*') {
		return `(?:${ prefix }(${ pattern }(?:${ suffix }${ prefix }${ pattern })*)${ suffix })?`;
	}
	return `${ prefix }(${ pattern })${ suffix }`;
}

export default function tokensToRegex(
	paramsSetters: ((p: Record<string, any>, s: string, key: number) => void)[],
	tokens: Token[],
	end: boolean,
) {
	const tokenRegex = tokens.map(t => tokenToFragment(t, paramsSetters));
	tokenRegex.unshift('^');
	tokenRegex.push(end ? '$' : '(?=/|$)');
	return new RegExp(tokenRegex.join(''), 'i');
}
