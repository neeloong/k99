
export function openIndexedDB(
	database: string,
	settingsStore: string,
	assetsStore: string,
	logStore: string,
	version: number
) {
	return new Promise<IDBDatabase>((resolve, reject) => {
		const req = indexedDB.open(database, version);
		req.addEventListener('upgradeneeded', e => {
			const db = (e.target as IDBOpenDBRequest).result;
			db.createObjectStore(assetsStore);
			db.createObjectStore(settingsStore);
			db.createObjectStore(logStore);
		});
		req.addEventListener('error', () =>  reject(req.error));
		req.addEventListener('success', () =>  resolve(req.result));
	});
}
