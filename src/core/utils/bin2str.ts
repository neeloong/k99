import type Encoding from '../types/Encoding';
import type HexEncoding from '../types/HexEncoding';

function utf8bin2str(code: Uint8Array): string {
	let ret: number[] = [];
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
function bin2base(buff: Uint8Array, chars = base64chars): string {
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

function bin2hex(buff: Uint8Array): string {
	const n = 4;
	let list = new Array(buff.byteLength * 2);
	for (let b of buff) {
		list.push(b >> 4 & 0x1111, b & 0x1111);
	}
	return list.map(v => hexChars[v]).join('');
}


function bin2str(value: null, encoding?: Encoding | HexEncoding | null): null;
function bin2str(value: Uint8Array, encoding?: null): Uint8Array;
function bin2str(value: Uint8Array, encoding: Encoding | HexEncoding): string;
function bin2str(value: Uint8Array, encoding?: Encoding | HexEncoding | null): string | Uint8Array;
function bin2str(value: Uint8Array | null, encoding?: null): Uint8Array | null;
function bin2str(value: Uint8Array | null, encoding: Encoding | HexEncoding): string | null;
function bin2str(value: Uint8Array | null, encoding?: Encoding | HexEncoding | null): string | Uint8Array | null;
function bin2str(value: Uint8Array | null, encoding?: Encoding | HexEncoding | null): Uint8Array | string | null {
	if (!value) { return null; }
	switch (encoding) {
		case 'utf8': return utf8bin2str(value);
		case 'base64': return bin2base(value);
		case 'hex': return bin2hex(value);
	}
	return value;
}
export default  bin2str;
