import type { Asset, Log, Setting } from 'k99';


function createAssetsApi(db: IDBDatabase, store: string): Asset.Api {
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
		stat(): any { return null; },
	};
}


function createSettingsApi(db: IDBDatabase, store: string): Setting.Api {
	return {
		async read(path) {
			return new Promise(r => {
				const request = db.transaction(store).objectStore(store).get(path);
				request.addEventListener('error', () =>  r(null));
				request.addEventListener('success', () =>  r(request.result || null));
			});
		},
		async write(path: string, cfg?: object | null | undefined) {
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
function createLogApi(db: IDBDatabase, store: string): Log.Api {
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
export default function createIndexedApis(
	database: string = 'k99',
	{
		assets = 'assets',
		log = 'log',
		settings = 'settings',
	}: {
		assets?: string,
		log?: string,
		settings?: string,
	} = {},
	version: number = 1
) {
	return new Promise<IDBDatabase>((resolve, reject) => {
		const req = indexedDB.open(database, version);
		req.addEventListener('upgradeneeded', e => {
			const db = (e.target as IDBOpenDBRequest).result;
			db.createObjectStore(assets);
			db.createObjectStore(log);
			db.createObjectStore(settings);
		});
		req.addEventListener('error', () =>  reject(req.error));
		req.addEventListener('success', () => resolve(req.result));
	}).then(db =>({
		logApi: createLogApi(db, log),
		assetsApi: createAssetsApi(db, assets),
		settingsApi: createSettingsApi(db, settings),
	}));
}
