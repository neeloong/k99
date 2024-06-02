/**
 * 
 * @param {Cache} cache 
 * @param {string} root 
 * @returns {import('k99/environment').Environment.Setting.Api}
 */
function createSettingsApi(cache, root) {
	return {
		async read(path) {
			path = `${ root }${ path }`;
			const response = await cache.match(path);
			if (!response) { return undefined; }
			return response.json();
		},
		async write(path, cfg) {
			path = `${ root }${ path }`;
			if (cfg === undefined) { return cache.delete(path); }
			await cache.put(path, new Response(JSON.stringify(cfg)));
			return true;
		},
	};
}
/**
 * 
 * @param {Cache} cache 
 * @param {string} root 
 * @returns {import('k99/environment').Environment.Asset.Api}
 */
function createAssetsApi(cache, root) {
	return {
		async read(path) {
			path = `${ root }${ path }`;
			const response = await cache.match(path);
			if (!response) { return null; }
			return new Uint8Array(await response.arrayBuffer());
		},
		async write(path, data) {
			path = `${ root }${ path }`;
			await cache.put(path, new Response(data));
			return true;
		},
		async delete(path) {
			path = `${ root }${ path }`;
			return cache.delete(path);
		},
		/** @returns {any} */
		stat() {
			return null;
		},
	};
}
/**
 * 
 * @param {Cache} cache 
 * @param {string} root 
 * @returns {import('k99/environment').Environment.Log.Api}
 */
function createLogApi(cache, root) {
	return {
		async read(path) {
			path = `${ root }${ path }`;
			const response = await cache.match(path);
			return response ? response.text() : '';
		},
		async write(path, log) {
			path = `${ root }${ path }`;
			const response = await cache.match(path);
			const text = `${ await response?.text() || '' }${ log }\n`;
			await cache.put(path, new Response(text));
			return true;
		},
		async clear(path) {
			path = `${ root }${ path }`;
			await cache.delete(path);
		},
	};
}
/**
 * 
 * @param {string} name 
 * @param {object} [options] 
 * @param {string} [options.assets] 
 * @param {string} [options.log] 
 * @param {string} [options.settings] 
 * @returns 
 */
export default async function createCacheApis(
	name = 'k99',
	{
		assets = '/k99/assets',
		log = '/k99/log',
		settings = '/k99/settings',
	} = {}
) {
	const cache = await caches.open(name);
	if (assets[assets.length - 1] !== '/') { assets = `${ assets }/`; }
	if (assets[0] !== '/') { assets = `/${ assets }`; }

	if (log[log.length - 1] !== '/') { log = `${ log }/`; }
	if (log[0] !== '/') { log = `/${ log }`; }

	if (settings[log.length - 1] !== '/') { settings = `${ settings }/`; }
	if (settings[0] !== '/') { settings = `/${ settings }`; }

	return {
		logApi: createLogApi(cache, log),
		assetsApi: createAssetsApi(cache, assets),
		settingsApi: createSettingsApi(cache, settings),
	};
}
