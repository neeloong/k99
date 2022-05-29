
export default function createStreamRead(readableStream: ReadableStream<Uint8Array>) {
	let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
	let current = 0;
	let cb: null | ((v: Uint8Array | null) => void) = null;
	let end = false;
	const dataList: Uint8Array[] = [];
	let dataSize = 0;
	const list: [number, (v: Uint8Array | null) => void][] = [];
	function get() {
		if (!current || dataSize <= current) {
			const chunk = new Uint8Array(dataSize);
			let index = 0;
			for (const item of dataList) {
				for (let i = 0; i < item.byteLength; i++, index++) {
					chunk[index] = item[i];
				}
			}
			dataSize = 0;
			dataList.length = 0;
			return chunk;
		}
		let item = dataList.shift();
		if (!item) { return null;  }
		const chunk = new Uint8Array(current);
		let index = 0;
		let i = 0;
		let len = item.length;
		while (index < current) {
			if (i >= length) {
				item = dataList.shift();
				if (!item) { break; }
				i = 0;
				len = item.length;
			}
			chunk[index] = item[i];
			i++;
			index++;
		}
		if (item && i < len) {
			dataList.unshift(new Uint8Array(item.buffer.slice(i)));
		}
		dataSize -= current;
		return chunk;
	}
	function add(data: Uint8Array) {
		dataSize += data.length || 0;
		dataList.push(data);
		return dataSize;
	}
	function runCb() {
		if (!cb) { return; }
		const v = dataSize ? get() : null;
		cb(v);
		[current, cb] = list.shift() || [0, null];
	}
	let running = true;
	async function run() {
		running = true;
		for (;;) {
			if (!cb) { break; }
			if (end) {
				runCb();
				continue;
			}
			if (dataSize && (!current || dataSize >= current)) {
				runCb();
				continue;
			}
			const {value, done} = await reader!.read();
			if (done) {
				end = true;
				continue;
			}
			add(value as Uint8Array);
			if (dataSize && (!current || dataSize >= current)) {
				runCb();
				continue;
			}
		}
		running = false;
	}

	function read(size: number = 0): Promise<Uint8Array | null> {
		return new Promise(resolve => {
			if (!reader) {
				reader = readableStream.getReader();
			}
			size = Math.max(size, 0);
			if (cb) {
				list.push([size, resolve]);
				return;
			}
			current = size;
			cb = resolve;
			run();
		});
	}
	return read;
}
