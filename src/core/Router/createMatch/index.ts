import { Match } from '../../types';
import tokensToRegex from './tokensToRegex';
import lexer from './lexer';
import toTokens, { Token } from './toTokens';
import clear from './clear';

type PSetter = (p: Record<string, any>, s: string) => void;
function getParams(
	pSetters: PSetter[],
	re: RegExp,
	path: string,
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
		fn(params, v);
	}
	return params;
}


const regex = /^(\.+)\/+/;
export default function createMatch(
	path: string,
	end: boolean,
): Match {
	if (!path || path === '*') {
		const match: Match = (_, parent) => ({ $path: parent });
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
	const pSetters: PSetter[] = [() => {}];
	const re = tokensToRegex(pSetters, [...clear(toTokens([...lexer(path)]))], end);
	if (isRoot) { return path => getParams(pSetters, re, path); }
	if (depth) {
		return (path, parent) => {
			const paths = parent.split('/').filter(Boolean);
			if (depth >= paths.length) { return getParams(pSetters, re, path); }
			const basePath = `/${ paths.splice(0, paths.length - depth).join('/') }`;
			return getParams(pSetters, re, path, basePath);
		};
	}
	return (path, parent) => {
		if (parent[parent.length - 1] === '/') {
			parent = parent.substring(0, parent.length - 1);
		}
		return getParams(pSetters, re, path, parent);
	};
}
