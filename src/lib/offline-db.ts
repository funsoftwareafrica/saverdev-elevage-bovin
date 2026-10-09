// Gestion hors ligne — IndexedDB pour stocker les saisies en attente de sync.
const DB_NAME = "saverdev-offline";
const DB_VERSION = 1;
const STORE_NAME = "pending-entries";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") { reject(new Error("IndexedDB non disponible")); return; }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "localId" });
      }
    };
  });
}

export interface PendingEntry {
  localId: string;
  type: string;
  data: Record<string, unknown>;
  createdAt: string;
  synced: boolean;
}

export async function addPendingEntry(type: string, data: Record<string, unknown>): Promise<string> {
  const localId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const entry: PendingEntry = { localId, type, data, createdAt: new Date().toISOString(), synced: false };
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).add(entry);
    tx.oncomplete = () => resolve(localId);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPendingEntries(): Promise<PendingEntry[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve((req.result as PendingEntry[]).filter((e) => !e.synced));
    req.onerror = () => reject(req.error);
  });
}

export async function markSynced(localId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(localId);
    getReq.onsuccess = () => { if (getReq.result) { (getReq.result as PendingEntry).synced = true; store.put(getReq.result); } };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function cleanSynced(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.getAll().onsuccess = (ev) => {
      const items = (ev.target as IDBRequest).result as PendingEntry[];
      for (const item of items) { if (item.synced) store.delete(item.localId); }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function countPending(): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve((req.result as PendingEntry[]).filter((e) => !e.synced).length);
    req.onerror = () => reject(req.error);
  });
}

export async function syncPending(onProgress?: (synced: number, total: number) => void): Promise<{ synced: number; failed: number }> {
  const pending = await getPendingEntries();
  if (pending.length === 0) return { synced: 0, failed: 0 };
  let synced = 0, failed = 0;
  for (const entry of pending) {
    try {
      const res = await fetch("/api/saisie", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: entry.type, ...entry.data }) });
      if (res.ok) { await markSynced(entry.localId); synced++; } else { failed++; }
    } catch { failed++; }
    onProgress?.(synced + failed, pending.length);
  }
  await cleanSynced();
  return { synced, failed };
}
