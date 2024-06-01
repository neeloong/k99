import type { CookieOption, Cookie } from './types';

export function *getCookie(
	sentCookies: Cookie[],
	name?: string
): Iterable<Cookie> {
	const list = sentCookies;
	for (const item of list) {
		if (name && item.name !== name) { continue; }
		yield { ...item };
	}
}

export function setCookiesHeader(headers: Headers, cookies: Cookie[]) {
	headers.delete('set-cookie');
	for (const { name, value, expire, domain, path, secure, httpOnly } of cookies) {
		if (!name) { continue; }
		headers.append('set-cookie', [
			`${ encodeURI(name) }=${ encodeURI(value || '') }`,
			expire && `Expires=${ expire }`,
			domain && `Domain=${ encodeURI(domain) }`,
			path && `Path=${ encodeURI(path) }`,
			secure && 'Secure',
			httpOnly && 'HttpOnly',
		].filter(Boolean).join('; '));
	}
}
export function getRequestCookies(cookie: string): Record<string, string> {
	let cookies: { [key: string]: string; } = {};
	for (const item of cookie.replace(/\s/g, '').split(';')) {
		const v = item.split('=');
		const name = decodeURIComponent(v.shift() as string);
		cookies[name] = decodeURIComponent(v.join('='));
	}
	return cookies;
}

export function clearCookie(
	sentCookies: Cookie[],
	cookies: Record<string, string>,
	name?: string | CookieOption,
	opt?: CookieOption | boolean,
): void {
	let expire = 'Fri, 31 Dec 1999 16:00:00 GMT';
	if (typeof name === 'string') {
		if (!name) { return; }
		const {
			domain, path, secure, httpOnly,
		}: CookieOption = opt !== true && opt || {};
		sentCookies.push({ name, value: 'delete', expire, domain, path, secure, httpOnly });
	} else {
		const { domain, path, secure, httpOnly }: CookieOption = name || {};
		sentCookies.length = 0;
		if (opt) {
			for (let name in cookies) {
				sentCookies.push({ name, value: 'delete', expire, domain, path, secure, httpOnly });
			}
		}
	}
}
