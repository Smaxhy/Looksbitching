// Photos and scan results live in IndexedDB on-device. Nothing is uploaded.
import type { PhotoRecord, ScanResult } from "./types";

const DB = "lookbitching";
type StoreName = "photos" | "scans";

function open(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => {
      const db = r.result;
      if (!db.objectStoreNames.contains("photos")) db.createObjectStore("photos", { keyPath: "id" });
      if (!db.objectStoreNames.contains("scans")) db.createObjectStore("scans", { keyPath: "id" });
    };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}

async function tx<T>(store: StoreName, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise<T>((res, rej) => {
    const t = db.transaction(store, mode);
    const req = fn(t.objectStore(store));
    t.oncomplete = () => { db.close(); res(req.result); };
    t.onerror = () => { db.close(); rej(t.error); };
  });
}

export const putPhoto = (p: PhotoRecord) => tx("photos", "readwrite", (s) => s.put(p));
export const putScan = (p: ScanResult) => tx("scans", "readwrite", (s) => s.put(p));
export const deletePhoto = (id: string) => tx("photos", "readwrite", (s) => s.delete(id));
export const deleteScan = (id: string) => tx("scans", "readwrite", (s) => s.delete(id));
export const allPhotos = async (): Promise<PhotoRecord[]> => ((await tx("photos", "readonly", (s) => s.getAll())) as PhotoRecord[]).sort((a, b) => a.ts - b.ts);
export const allScans = async (): Promise<ScanResult[]> => ((await tx("scans", "readonly", (s) => s.getAll())) as ScanResult[]).sort((a, b) => a.ts - b.ts);
export const clearAll = async () => { await tx("photos", "readwrite", (s) => s.clear()); await tx("scans", "readwrite", (s) => s.clear()); };
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
