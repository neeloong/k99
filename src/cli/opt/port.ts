export function value(...opts: string[]) {
	for (let opt of opts) {
		if (/^\d+$/.test(opt)) {
			const port = Number(opt);
			if (port > 0 && port < 65535) {
				return port;
			}
		}
	}
}

export const name = 'port';
export const explain = '监听的网络端口号';
