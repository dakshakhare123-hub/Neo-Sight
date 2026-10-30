// NeoScan IndexedDB Storage Engine & Offline Queue Manager
// Provides high-capacity local storage for infant photographs and offline syncing

const DB_NAME = "neoscan_mobile_db";
const DB_VERSION = 1;

export const openNeoScanDB = () => {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      resolve(null);
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("images")) {
        db.createObjectStore("images", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("offline_queue")) {
        db.createObjectStore("offline_queue", { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      console.warn("[NeoScan DB] Could not open IndexedDB:", request.error);
      resolve(null);
    };
  });
};

export const saveImageBlob = async (id, dataUrl) => {
  const db = await openNeoScanDB();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction("images", "readwrite");
      const store = tx.objectStore("images");
      store.put({ id, dataUrl, savedAt: new Date().toISOString() });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch (e) {
      resolve(false);
    }
  });
};

export const getImageBlob = async (id) => {
  const db = await openNeoScanDB();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction("images", "readonly");
      const store = tx.objectStore("images");
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result ? req.result.dataUrl : null);
      req.onerror = () => resolve(null);
    } catch (e) {
      resolve(null);
    }
  });
};

export const enqueueOfflineScreening = async (item) => {
  const db = await openNeoScanDB();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction("offline_queue", "readwrite");
      const store = tx.objectStore("offline_queue");
      store.put(item);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch (e) {
      resolve(false);
    }
  });
};

export const getOfflineQueue = async () => {
  const db = await openNeoScanDB();
  if (!db) return [];
  return new Promise((resolve) => {
    try {
      const tx = db.transaction("offline_queue", "readonly");
      const store = tx.objectStore("offline_queue");
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    } catch (e) {
      resolve([]);
    }
  });
};

export const removeQueueItem = async (id) => {
  const db = await openNeoScanDB();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction("offline_queue", "readwrite");
      const store = tx.objectStore("offline_queue");
      store.delete(id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch (e) {
      resolve(false);
    }
  });
};

export const NeoScanStorage = {
  open: openNeoScanDB,
  saveImageBlob,
  getImageBlob,
  enqueueOfflineScreening,
  getOfflineQueue,
  removeQueueItem
};

export default NeoScanStorage;
