import { Match } from '../../types';
import tokensToRegex from './tokensToRegex';
import lexer from './lexer';
import toTokens, { Token } from './toTokens';
import clear from './clear';

type PSetter = (p: Record<string, any>, s: string, key: number) => void;
function getParams(
	pSetters: PSetter[],
	re: RegExp,
	path: string,
	key: number,
	parent?: string,
): Match.Result | null {
	const res = re.exec(parent ? path.substring(parent.length) : path);
	if (!res) { return null; }
	const params: Match.Result = {$path: parent ? `${ parent }${ res[0] }` : res[0]};
	for (let i = 1; i < res.length; i++) {
		const v = res[i];
		if (v === undefined) { continue; }
		const fn = pSetters[i];
		if (!fn) { continue; }
		fn(params, v, key);
	}
	return params;
}


function setKey(tokens: Token[]): number {
	let key = 0;
	for (const token of tokens) {
		if (typeof token === 'string') { continue; }
		if (token.name) { continue; }
		if (!token.pattern) { continue; }
		token.name = key++;
	}
	return key;

}
const regex = /^(\.+)\/+/;
export default function createMatch(
	path: string,
	end: boolean,
): Match {
	if (!path || path === '*') {
		const match: Match = (_, parent) => ({ $path: parent });
		match.keyLen = 0;
		return match;
	}
	if (path === '.') {
		const match: Match = (path, parent) => {
			if (parent[parent.length - 1] === '/') {
				parent = parent.substring(0, parent.length - 1);
			}
			const char = path[parent.length];
			if (char && (char !== '/' || end && path.length - 1 > parent.length)) {
				return null;
			}
			return {$path: `${ parent }${ char }`};
		};
		match.keyLen = 0;
		return match;

	}
	const isRoot = path[0] === '/';
	let depth = 0;
	for (let s = regex.exec(path); s; s = regex.exec(path)) {
		const [{length}, {length: len}] = s;
		path = path.substring(length);
		depth += len - 1;
	}
	if (depth) {
		path = `/${ path }`;
	}
	const tokens = [...clear(toTokens([...lexer(path)]))];
	const key = setKey(tokens);
	const pSetters: PSetter[] = [() => {}];
	const re = tokensToRegex(pSetters, tokens, end);
	if (isRoot) {
		const match: Match = path => getParams(pSetters, re, path, 0);
		match.keyLen = key;
		match.isRoot = true;
		return match;
	}
	if (depth) {
		const match: Match = (path, parent, key) => {
			const paths = parent.split('/').filter(Boolean);
			if (depth >= paths.length) { return getParams(pSetters, re, path, 0); }
			const basePath = `/${ paths.splice(0, paths.length - depth).join('/') }`;
			return getParams(pSetters, re, path, key, basePath);
		};
		match.keyLen = key;
		return match;
	}


	const match: Match =  (path, parent, key) => {
		if (parent[parent.length - 1] === '/') {
			parent = parent.substring(0, parent.length - 1);
		}
		return getParams(pSetters, re, path, key, parent);
	};
	match.keyLen = key;
	return match;
}
