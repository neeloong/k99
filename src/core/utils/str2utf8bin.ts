
export default function str2utf8bin(str: string): Uint8Array {
	let out: number[] = [];
	let i = 0;
	for (; i < str.length; i++) {
		const c = str.codePointAt(i);
		if (typeof c !== 'number') { break; }
		if (c >= 65536) { i++; }
		if (c < 128) {
			out.push(c);
		} else if (c < 2048) {
			// 11 = 5 + 6
			out.push(192 | 31 & c >> 6);
			out.push(128 | 63 & c);
		} else if (c < 65536) {
			// 16 = 4 + 6 * 2
			out.push(224 | 15 & c >> 12);
			out.push(128 | 63 & c >> 6);
			out.push(128 | 63 & c);
		} else {
			// 21 = 3 + 6 * 3
			out.push(240 | 7 & c >> 18);
			out.push(128 | 63 & c >> 12);
			out.push(128 | 63 & c >> 6);
			out.push(128 | 63 & c);
		}
	}
	return new Uint8Array(out);
}
