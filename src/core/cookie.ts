import type { CookieClearOption, CookieOptionInfo } from './types/cookie';


export interface CookieInfo extends CookieOptionInfo {
	name: string;
}

export function *getCookie(
	sentCookies: CookieInfo[],
	name?: string
): Iterable<CookieOptionInfo> {
	const list = sentCookies;
	for (const item of list) {
		if (name && item.name !== name) { continue; }
		yield { ...item };
	}
}

export function getCookieHeader(
	list: CookieInfo[],
): string[] {
	return list.map(({
		name,
		value,
		expire,
		domain,
		path,
		secure,
		httpOnly,
	}) => name && [
		`${ encodeURI(name) }=${ encodeURI(value || '') }`,
		expire && `Expires=${ expire }`,
		domain && `Domain=${ encodeURI(domain) }`,
		path && `Path=${ encodeURI(path) }`,
		secure && 'Secure',
		httpOnly && 'HttpOnly',
	].filter(Boolean).join('; ')).filter(Boolean);
}

export function getRequestCookies(
	cookie: string,
): Record<string, string> {
	let cookies: { [key: string]: string; } = {};
	for (const item of cookie.replace(/\s/g, '').split(';')) {
		const v = item.split('=');
		const name = decodeURIComponent(v.shift() as string);
		cookies[name] = decodeURIComponent(v.join('='));
	}
	return cookies;
}

export function clearCookie(
	sentCookies: CookieInfo[],
	cookies: Record<string, string>,
	name?: string | CookieClearOption,
	opt?: CookieClearOption | boolean,
): void {
	let expire = 'Fri, 31 Dec 1999 16:00:00 GMT';
	if (typeof name === 'string') {
		if (!name) { return; }
		const {
			domain, path, secure, httpOnly,
		}: CookieClearOption = opt !== true && opt || {};
		sentCookies.push({ name, value: 'delete', expire, domain, path, secure, httpOnly });
	} else {
		const { domain, path, secure, httpOnly }: CookieClearOption = name || {};
		sentCookies.length = 0;
		if (opt) {
			for (let name in cookies) {
				sentCookies.push({ name, value: 'delete', expire, domain, path, secure, httpOnly });
			}
		}
	}
}
