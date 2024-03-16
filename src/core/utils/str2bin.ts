import type { Encoding } from '../types/Encoding';
import type { HexEncoding } from '../types/HexEncoding';

let base64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function base2bin(
	str: string,
	chars: string = base64chars,
): Uint8Array {
	const n = Math.floor(Math.log2(chars.length));
	str = str.replace(/[=\s]+/g, '');
	let list = new Uint8Array(str.length * n >> 3);
	let next = 0;
	let v = 0, l = 0;
	for (let c of str) {
		v = v << n | chars.indexOf(c);
		l += n;
		while (l >= 8) {
			l -= 8;
			list[next++] = v >> l & 0xff;
			v &= (1 << l) - 1;
		}
	}
	return list;
}

let hexChars = '0123456789ABCDEF';


function hex2bin(str: string): Uint8Array {
	let list: number[] = [];
	for (let i = 0; i < str.length; i += 2) {
		list.push(hexChars.indexOf(str[i]) * 16 + hexChars.indexOf(str[i + 1] || '0'));
	}
	return new Uint8Array(list);
}

function str2bin(value: null, encoding?: Encoding | HexEncoding | null): null;
function str2bin(value: string | ArrayBuffer | ArrayBufferView, encoding?: Encoding | HexEncoding | null): Uint8Array;
function str2bin(value: string | ArrayBuffer | ArrayBufferView | null, encoding?: Encoding | HexEncoding | null): Uint8Array | null;
function str2bin(value: string | ArrayBuffer | ArrayBufferView | null, encoding?: Encoding | HexEncoding | null): Uint8Array | null {
	if (ArrayBuffer.isView(value)) {
		return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
	}
	if (value instanceof ArrayBuffer) { return new Uint8Array(value); }
	if (typeof value !== 'string') { return null; }
	switch (encoding) {
		default:
		case 'utf8': return new TextEncoder().encode(value);
		case 'base64': return base2bin(value);
		case 'hex': return hex2bin(value);
	}
}
export default str2bin;
