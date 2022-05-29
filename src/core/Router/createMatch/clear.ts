import { Token } from './toTokens';

function isNewLine(token: Token) {
	if (token === '/') { return true; }
	if (typeof token !== 'string' && token.prefix === '/') { return true; }
	return false;
}
const dotRegex = /^\.+$/;
function valid(paragraph: Token[]) {
	if (paragraph[0] !== '/') { return true; }
	if (paragraph.length === 1) { return false; }
	if (paragraph.length !== 2) { return true; }
	const [, t] = paragraph;
	if (typeof t !== 'string') { return true; }
	if (!dotRegex.test(t)) { return true; }
	return false;
}

export default function *clear(tokens: Iterable<Token>): Iterable<Token> {
	let paragraph: Token[] = ['/'];
	for (const token of tokens) {
		if (isNewLine(token)) {
			if (valid(paragraph)) {
				yield *paragraph;
			}
			paragraph = [];
		}
		paragraph.push(token);
	}
	if (valid(paragraph)) {
		yield *paragraph;
	}
}
