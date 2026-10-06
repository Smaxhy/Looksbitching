"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { PhotoRecord, ScanResult } from "@/lib/types";
import * as db from "@/lib/db";

interface DataCtx {
  photos: PhotoRecord[];
  scans: ScanResult[];
  loaded: boolean;
  addPhoto: (p: PhotoRecord) => Promise<void>;
  addScan: (s: ScanResult) => Promise<void>;
  removePhoto: (id: string) => Promise<void>;
  removeScan: (id: string) => Promise<void>;
  wipe: () => Promise<void>;
  bulkImport: (photos: PhotoRecord[], scans: ScanResult[]) => Promise<void>;
}
const D = createContext<DataCtx | null>(null);
export const useData = () => {
  const c = useContext(D);
  if (!c) throw new Error("useData outside provider");
  return c;
};

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [photos, setPhotos] = useState<PhotoRecord[]>([]);
  const [scans, setScans] = useState<ScanResult[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    try { setPhotos(await db.allPhotos()); setScans(await db.allScans()); } catch { /* IndexedDB blocked */ }
    setLoaded(true);
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const value: DataCtx = {
    photos, scans, loaded,
    addPhoto: async (p) => { await db.putPhoto(p); await refresh(); },
    addScan: async (s) => { await db.putScan(s); await refresh(); },
    removePhoto: async (id) => { await db.deletePhoto(id); await refresh(); },
    removeScan: async (id) => { await db.deleteScan(id); await refresh(); },
    wipe: async () => { await db.clearAll(); await refresh(); },
    bulkImport: async (ph, sc) => { for (const p of ph) await db.putPhoto(p); for (const s of sc) await db.putScan(s); await refresh(); },
  };
  return <D.Provider value={value}>{children}</D.Provider>;
}
