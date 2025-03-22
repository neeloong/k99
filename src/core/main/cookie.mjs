/** @import { Cookie, CookieOption } from './types' */
/**
 *
 * @param {Cookie[]} sentCookies
 * @param {string} [name]
 * @returns {Iterable<Cookie>}
 */
export function *getCookie(sentCookies, name) {
	const list = sentCookies;
	for (const item of list) {
		if (name && item.name !== name) { continue; }
		yield { ...item };
	}
}

/**
 *
 * @param {Headers} headers
 * @param {Cookie[]} cookies
 * @returns {void}
 */
export function setCookiesHeader(headers, cookies) {
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
/**
 *
 * @param {string} cookie
 * @returns {Record<string, string>}
 */
export function getRequestCookies(cookie) {
	/** @type {{ [key: string]: string; }} */
	let cookies = {};
	for (const item of cookie.replace(/\s/g, '').split(';')) {
		const v = item.split('=');
		const name = decodeURIComponent(/** @type {string} */(v.shift()));
		cookies[name] = decodeURIComponent(v.join('='));
	}
	return cookies;
}
/**
 *
 * @param {Cookie[]} sentCookies
 * @param {Record<string, string>} cookies
 * @param {string | CookieOption} [name]
 * @param {CookieOption | boolean} [opt]
 * @returns {void}
 */
export function clearCookie(
	sentCookies,
	cookies,
	name,
	opt,
) {
	let expire = 'Fri, 31 Dec 1999 16:00:00 GMT';
	if (typeof name === 'string') {
		if (!name) { return; }
		/** @type {CookieOption} */
		const { domain, path, secure, httpOnly } = opt !== true && opt || {};
		sentCookies.push({ name, value: 'delete', expire, domain, path, secure, httpOnly });
	} else {
		/** @type {CookieOption} */
		const { domain, path, secure, httpOnly } = name || {};
		sentCookies.length = 0;
		if (opt) {
			for (let name in cookies) {
				sentCookies.push({ name, value: 'delete', expire, domain, path, secure, httpOnly });
			}
		}
	}
}
