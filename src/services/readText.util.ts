import type { Encoding } from 'k99';

export default async function readText(
	read: (size: number, encoding: Encoding) => Promise<string | null>,
	encoding: Encoding = 'utf8'
): Promise<string> {
	const text: string[] = [];
	for (;;) {
		const t = await read(0, encoding);
		if (t === null) { break; }
		text.push(t);
	}
	return text.join('');
}
