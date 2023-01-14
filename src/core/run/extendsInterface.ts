const dotRegex = /^\.+$/;
function resolvePath(...paths: string[]) {
	const list: string[] = [];
	for (const k of paths.map(p => p.split('/')).flat()) {
		if (!k || k === '.') { continue; }
		if (dotRegex.test(k)) {
			list.length = Math.max(0, list.length - k.length + 1);
			continue;
		}
		list.push(k);
	}
	return `${ list.join('/') }`;
}


/** 自扩展接口 */
interface Interface {
	(): string;
	(path: string): this;
	(path: string, mark: true): this;
}
function subInterface<T extends object, E extends object>(
	interfaces: T,
	extendsInterfaces: E | undefined,
	mark: string,
	basePath: string,
	path?: string,
	setMark?: boolean,
): string | T & E & Interface {
	if (path === undefined) { return basePath; }
	if (path === '~') {
		path = mark;
	} else if (path.substring(0, 2) === '~/') {
		path = `${ mark }/${ path.substring(2) }`;
	} else if (path.substring(0, 1) === '~') {
		path = `plugins/${ path.substring(1) }`;
	} else if (path.substring(0, 2) === '\\~') {
		path = path.substring(1);
	}
	return Interface<T, E>(
		interfaces,
		extendsInterfaces,
		setMark ? resolvePath(path) : mark,
		setMark ? '' : path,
		basePath,
	);
}
/** 自扩展接口 */
function Interface<T extends object, E extends object>(
	interfaces: T,
	extendsInterfaces?: E,
	mark: string = '',
	path: string = '',
	basePath: string = ''
): T & E & Interface {
	basePath = resolvePath(basePath, path);
	const ret = subInterface.bind(
		null,
		interfaces,
		extendsInterfaces,
		mark,
		basePath,
	) as T & E & Interface;

	for (const k in interfaces) {
		const v = interfaces[k];
		ret[k] = typeof v === 'function'
			? (path: string, ...p: any[]) => v(
				resolvePath(basePath, path),
				...p
			) : v as any;
	}
	if (!extendsInterfaces) { return ret; }
	for (const k in extendsInterfaces) {
		ret[k] = extendsInterfaces[k] as any;
	}
	return ret;
}

export default Interface;
