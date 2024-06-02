/**
 * 
 * @param {string} database 
 * @param {number} version 
 * @param {string} settingsStore 
 * @param {string} assetsStore 
 * @param {string} logStore 
 * @returns {Promise<IDBDatabase>}
 */
export default function openIndexedDB(
	database,
	version,
	settingsStore,
	assetsStore,
	logStore,
) {
	/** @type {Promise<IDBDatabase>} */
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(database, version);
		req.addEventListener('upgradeneeded', e => {
			const db = /** @type {IDBOpenDBRequest} */(e.target).result;
			db.createObjectStore(assetsStore);
			db.createObjectStore(settingsStore);
			db.createObjectStore(logStore);
		});
		req.addEventListener('error', () =>  reject(req.error));
		req.addEventListener('success', () =>  resolve(req.result));
	});
}
