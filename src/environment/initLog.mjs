/**
 * 包装日志文本
 * @param {string} log 原始的日志
 * @param {import('./index.ts').Log.Options} [opt] 包装选项
 */
function pack(log, { tags, indent, date } = {}) {
	let extendInfo = '';
	if (tags) {
		if (!Array.isArray(tags)) { tags = [tags]; }
		extendInfo = tags.map(tag => `[${ tag }]`).join(' ');
	}
	if (date) {
		extendInfo = `${ new Date().toISOString() } ${ extendInfo }`;
	}
	if (!log.includes('\n')) {
		return `${ extendInfo } ${ log }`;
	}
	if (typeof indent === 'number') {
		indent = Math.floor(indent);
		if (isFinite(indent) && indent > 0) {
			indent = Array(indent).fill(' ').join('');
		}
	}
	if (!indent || typeof indent !== 'string') {
		indent = '  ';
	}
	log = `${ extendInfo }\n${ log }`;
	log = log.split('\n').join(`\n${ indent }`);
	return log;
}

/**
 * 
 * @param {any} log 
 * @returns 
 */
function getErrorLog(log) {
	if (typeof log === 'string') { return log; }
	if (log instanceof Error) { return log.stack || `${ log.name }:${ log.message }`; }
	return String(log);
}
const regex = /(?:^|\/)(debug|error|warn|info)\/?$|^\/?(debug|error|warn|info)(?:\/|$)/;
/**
 * 
 * @param {string} path 
 * @param {string} log 
 * @returns 
 */
async function defaultWrite(path, log) {
	switch (path) {
		case 'debug': console.debug(log); break;
		case 'info': console.info(log); break;
		case 'warn': console.warn(log); break;
		case 'error': console.error(log); break;
	}
	console.group(`log @ ${ path }`);
	const v = regex.exec(path);
	switch (v ? v[1] || v[2] : '') {
		case 'debug': console.debug(log); break;
		case 'info': console.info(log); break;
		case 'warn': console.warn(log); break;
		case 'error': console.error(log); break;
		default: console.log(log); break;
	}
	console.groupEnd();
	return true;
}
async function defaultRead() { return ''; }
async function defaultClear() { }
/**
 * 
 * @param {import('./index.ts').Log.Api} [api] 
 * @returns {import('./index.ts').Log}
 */
export default function initLog({
	read = defaultRead,
	write = defaultWrite,
	clear = defaultClear,
} = {}) {
	/**
	 * 
	 * @param {string} path 
	 * @param {string} log 
	 * @param {import('./index.ts').Log.Options} [opt] 
	 * @returns 
	 */
	function writeLog(path, log, opt) {
		return write(path, pack(log, opt));
	}
	return {
		read, write: writeLog, clear,
		async debug(log, opt) {
			return writeLog('debug', log, opt);
		},
		async info(log, opt) {
			return writeLog('info', log, opt);
		},
		async warn(log, opt) {
			return writeLog('warn', getErrorLog(log), opt);
		},
		async error(log, opt) {
			return writeLog('error', getErrorLog(log), opt);
		},
	};
}
