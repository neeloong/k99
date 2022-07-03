import { Match } from '../../types';
import tokensToRegex from './tokensToRegex';
import lexer from './lexer';
import toTokens from './toTokens';
import clear from './clear';

type PSetter = (p: Record<string, any>, s: string) => void;

export default function createMatch(
	path: string,
	end: boolean,
): Match {
	if (!path || path === '*') { return $ => [$, {}]; }
	if (path === '.') {
		return $ => $ && ($[0] !== '/' || end && $.length > 1) ? null : [$,  {}];
	}
	path = path.replace(/[\\/]+/g, '/').replace(/^(.*\/)*/, '/');
	const pSetters: PSetter[] = [() => {}];
	const re = tokensToRegex(pSetters, [...clear(toTokens([...lexer(path)]))], end);
	return p => {
		const res = re.exec(p);
		if (!res) { return null; }
		const params: Record<string, any> = {};
		for (let i = 1; i < res.length; i++) {
			const v = res[i];
			if (v === undefined) { continue; }
			const fn = pSetters[i];
			if (!fn) { continue; }
			fn(params, v);
		}
		const [parent] = res;
		const subpath = parent[parent.length - 1] === '/'
			? p.substring(parent.length - 1)
			: p.substring(parent.length);
		return [subpath, params];
	};
}
