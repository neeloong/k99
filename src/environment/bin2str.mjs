/**
 * 
 * @param {Uint8Array} code string
 * @returns 
 */
function utf8bin2str(code) {
	/** @type {number[]} */
	let ret = [];
	let index = 0;
	while (index < code.length) {
		let c = code[index++] | 0;
		if (c >= 0b11110000) {
			c = (c & 0x7) << 18;
			c |= (code[index++] & 0x3F) << 12;
			c |= (code[index++] & 0x3F) << 6;
			c |= code[index++] & 0x3F;
		} else if (c >= 0b11100000) {
			c = (c & 0xF) << 12;
			c |= (code[index++] & 0x3F) << 6;
			c |= code[index++] & 0x3F;
		} else if (c >= 0b11000000) {
			c = (c & 0x1F) << 6;
			c |= code[index++] & 0x3F;
		}
		ret.push(c);
	}
	return ret.map(x => String.fromCharCode(x)).join('');
}

let base64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
/**
 * 
 * @param {Uint8Array} buff 
 * @param {string} [chars] 
 * @returns 
 */
function bin2base(buff, chars = base64chars) {
	const n = Math.floor(Math.log2(chars.length));
	const mask = (1 << n) - 1;
	let list = new Array(Math.floor(((buff.byteLength << 3) + n - 1) / n));
	let next = 0;
	let v = 0, l = 0;
	for (let b of buff) {
		v = v << 8 | b;
		l += 8;
		while (l >= n) {
			l -= n;
			list[next++] = chars[v >> l & mask];
			v &= (1 << l) - 1;
		}
	}
	if (l) { list[next++] = chars[v << n - l & mask]; }
	while (list.length % 4) { list.push('='); }
	return list.join('');
}
let hexChars = '0123456789ABCDEF';
/**
 * 
 * @param {Uint8Array} buff 
 * @returns {string}
 */
function bin2hex(buff) {
	let list = new Array(buff.byteLength * 2);
	for (let b of buff) {
		list.push(b >> 4 & 0x1111, b & 0x1111);
	}
	return list.map(v => hexChars[v]).join('');
}

/**
 * 
 * @overload
 * @param {null} value 
 * @param {import('./index.ts').Encoding | import('./index.ts').HexEncoding | null} [encoding] 
 * @returns {null}
 */
/**
 * 
 * @overload
 * @param {Uint8Array} value 
 * @param {null} [encoding] 
 * @returns {Uint8Array}
 */
/**
 * 
 * @overload
 * @param {Uint8Array} value 
 * @param {import('./index.ts').Encoding | import('./index.ts').HexEncoding} encoding 
 * @returns {string}
 */
/**
 * 
 * @overload
 * @param {Uint8Array} value 
 * @param {import('./index.ts').Encoding | import('./index.ts').HexEncoding | null} [encoding] 
 * @returns {string | Uint8Array}
 */
/**
 * 
 * @overload
 * @param {Uint8Array?} value 
 * @param {null} [encoding] 
 * @returns {string | Uint8Array | null}
 */
/**
 * 
 * @overload
 * @param {Uint8Array?} value 
 * @param {import('./index.ts').Encoding | import('./index.ts').HexEncoding} encoding 
 * @returns {string | null}
 */
/**
 * 
 * @overload
 * @param {Uint8Array?} value 
 * @param {import('./index.ts').Encoding | import('./index.ts').HexEncoding | null} [encoding] 
 * @returns {string | Uint8Array | null}
 */
/**
 * 
 * @param {Uint8Array?} value 
 * @param {import('./index.ts').Encoding | import('./index.ts').HexEncoding | null} [encoding] 
 * @returns {string | Uint8Array | null}
 */
function bin2str(value, encoding) {
	if (!value) { return null; }
	switch (encoding) {
		case 'utf8': return utf8bin2str(value);
		case 'base64': return bin2base(value);
		case 'hex': return bin2hex(value);
	}
	return value;
}
export default bin2str;
