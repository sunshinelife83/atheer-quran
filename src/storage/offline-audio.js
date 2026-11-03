const DB_NAME = "AtheerQuranOfflineDB";
const STORE = "offline_audios";

function openOfflineAudioDatabase() {
  if (!globalThis.indexedDB) return Promise.reject(new Error("IndexedDB is unavailable"));

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE)) database.createObjectStore(STORE, { keyPath: "id" });
    };
    request.onsuccess = () => {
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
    request.onerror = () => reject(request.error || new Error("Unable to open offline audio database"));
  });
}

function runOfflineAudioTransaction(transactionMode, createStoreRequest) {
  return openOfflineAudioDatabase().then((database) => new Promise((resolve, reject) => {
    let transaction;
    let request;
    let requestValue;

    try {
      transaction = database.transaction(STORE, transactionMode);
      request = createStoreRequest(transaction.objectStore(STORE));
    } catch (error) {
      database.close();
      reject(error);
      return;
    }

    request.onsuccess = () => { requestValue = request.result; };
    transaction.oncomplete = () => {
      database.close();
      resolve(requestValue);
    };
    transaction.onabort = () => {
      database.close();
      reject(transaction.error || request.error || new Error("Offline audio transaction aborted"));
    };
  }));
}

export function saveOfflineAudio(record) {
  return runOfflineAudioTransaction("readwrite", (store) => store.put(record));
}

export function getOfflineAudio(id) {
  return runOfflineAudioTransaction("readonly", (store) => store.get(id));
}

export function listOfflineAudio() {
  return runOfflineAudioTransaction("readonly", (store) => store.getAll());
}

export function deleteOfflineAudio(id) {
  return runOfflineAudioTransaction("readwrite", (store) => store.delete(id));
}
