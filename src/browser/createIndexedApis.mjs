/**
 * 
 * @param {IDBDatabase} db 
 * @param {string} store 
 * @returns {import('k99/environment').Asset.Api}
 */
function createAssetsApi(db, store) {
	return {
		async read(path) {
			return new Promise(r => {
				const request = db.transaction(store).objectStore(store).get(path);
				request.addEventListener('error', () =>  r(null));
				request.addEventListener('success', () =>  r(request.result || null));
			});
		},
		async write(path, data) {
			return new Promise(r => {
				const request = db.transaction(store, 'readwrite').objectStore(store).add(data, path);
				request.addEventListener('error', () =>  r(false));
				request.addEventListener('success', () =>  r(true));
			});
		},
		async delete(path) {
			return new Promise(r => {
				const request = db.transaction(store, 'readwrite').objectStore(store).delete(path);
				request.addEventListener('error', () =>  r(false));
				request.addEventListener('success', () =>  r(true));
			});
		},
		/** @returns {any} */
		stat() { return null; },
	};
}



/**
 * 
 * @param {IDBDatabase} db 
 * @param {string} store 
 * @returns {import('k99/environment').Setting.Api}
 */
function createSettingsApi(db, store) {
	return {
		async read(path) {
			return new Promise(r => {
				const request = db.transaction(store).objectStore(store).get(path);
				request.addEventListener('error', () =>  r(null));
				request.addEventListener('success', () =>  r(request.result || null));
			});
		},
		async write(path, cfg) {
			if (cfg === null || cfg === undefined) {
				return new Promise(r => {
					const request = db.transaction(store, 'readwrite').objectStore(store).delete(path);
					request.addEventListener('error', () =>  r(false));
					request.addEventListener('success', () =>  r(true));
				});

			}
			return new Promise(r => {
				const request = db.transaction(store, 'readwrite').objectStore(store).add(cfg, path);
				request.addEventListener('error', () =>  r(false));
				request.addEventListener('success', () =>  r(true));
			});
		},
	};
}

/**
 * 
 * @param {IDBDatabase} db 
 * @param {string} store 
 * @returns {import('k99/environment').Log.Api}
 */
function createLogApi(db, store) {
	return {
		async read(path) {
			return new Promise(r => {
				const request = db.transaction(store).objectStore(store).get(path);
				request.addEventListener('error', () =>  r(''));
				request.addEventListener('success', () =>  r(request.result || null));
			});
		},
		async write(path, log) {
			return new Promise(r => {
				const transaction = db.transaction(store, 'readwrite');
				const request = transaction.objectStore(store).get(path);
				request.addEventListener('error', () =>  r(false));
				request.addEventListener('success', () =>  {
					const request2 = transaction.objectStore(store).add(`${ request.result || '' }${ log  }\n`, path);
					request2.addEventListener('error', () =>  r(false));
					request2.addEventListener('success', () =>  r(true));
				});
			});
		},
		async clear(path) {
			return new Promise(r => {
				const request = db.transaction(store, 'readwrite').objectStore(store).delete(path);
				request.addEventListener('error', () =>  r());
				request.addEventListener('success', () =>  r());
			});
		},
	};
}
/**
 * 
 * @param {string} database 
 * @param {object} [options] 
 * @param {string} [options.assets] 
 * @param {string} [options.log] 
 * @param {string} [options.settings] 
 * @param {number} version 
 * @returns 
 */
export default function createIndexedApis(
	database = 'k99',
	{
		assets = 'assets',
		log = 'log',
		settings = 'settings',
	} = {},
	version = 1
) {
	/** @type {Promise<IDBDatabase>} */
	const p = new Promise((resolve, reject) => {
		const req = indexedDB.open(database, version);
		req.addEventListener('upgradeneeded', e => {
			const db = /** @type {IDBOpenDBRequest} */(e.target).result;
			db.createObjectStore(assets);
			db.createObjectStore(log);
			db.createObjectStore(settings);
		});
		req.addEventListener('error', () =>  reject(req.error));
		req.addEventListener('success', () => resolve(req.result));
	})
	
	return p.then(db =>({
		logApi: createLogApi(db, log),
		assetsApi: createAssetsApi(db, assets),
		settingsApi: createSettingsApi(db, settings),
	}));
}
