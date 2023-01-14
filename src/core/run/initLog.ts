import type { Log } from '../types';

import extendsInterface from './extendsInterface';

/**
 * 包装日志文本
 * @param log 原始的日志
 * @param opt 包装选项
 */
function pack(log: string, { tags, indent, date }: Log.Options = {}) {
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

function getErrorLog(log: any) {
	if (typeof log === 'string') { return log; }
	if (log instanceof Error) { return log.stack || `${ log.name }:${ log.message }`; }
	return String(log);
}
const regex = /(?:^|\/)(debug|error|warn|info)\/?$|^\/?(debug|error|warn|info)(?:\/|$)/;
async function defaultWrite(path: string, log: string) {
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
async function defaultClear() {}
export default function initLog({
	read = defaultRead,
	write = defaultWrite,
	clear = defaultClear,
}: Log.Api = {}): Log {
	function writeLog(path: string, log: string, opt?: Log.Options) {
		return write(path, pack(log, opt));
	}
	return extendsInterface({read, write: writeLog, clear }, {
		async debug(log: string, opt?: Log.Options) {
			return writeLog('debug', log, opt);
		},
		async info(log: string, opt?: Log.Options) {
			return writeLog('info', log, opt);
		},
		async warn(log: any, opt?: Log.Options) {
			return writeLog('warn', getErrorLog(log), opt);
		},
		async error(log: string, opt?: Log.Options) {
			return writeLog('error', getErrorLog(log), opt);
		},
	});
}
