export default function createBufferRead(request: Request) {
	let arrayBuffer: Promise<[Uint8Array, Uint8Array, number] | null> | undefined;
	function read(size: number = 0): Promise<Uint8Array | null> {
		if (!arrayBuffer) {
			arrayBuffer = request.arrayBuffer().then(t => [new Uint8Array(0), new Uint8Array(t), 0]);
		}
		arrayBuffer = arrayBuffer.then(v => {
			if (!v) { return null; }
			let [, buff, index] = v;
			if (index >= buff.byteLength) { return null; }
			if (!size || size + index >= buff.byteLength) {
				return [ buff.slice(index), buff, buff.byteLength ];
			}
			let end = index + size;
			return [ buff.slice(index, end), buff, end ];
		});
		return arrayBuffer.then(v => {
			if (!v) { return null; }
			const [value] = v;
			return value;
		});
	}
	return read;
}
