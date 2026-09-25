const DB_NAME = "despensa-mx-cache";
const DB_VER = 1;
const STORE = "entradas";
const memoria = new Map();

function abrir() {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, DB_VER);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const os = db.createObjectStore(STORE, { keyPath: "clave" });
          os.createIndex("tipo", "tipo", { unique: false });
          os.createIndex("expira", "expira", { unique: false });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function cacheGet(clave) {
  if (memoria.has(clave)) {
    const hit = memoria.get(clave);
    if (hit.expira > Date.now()) return hit.valor;
    memoria.delete(clave);
  }
  const db = await abrir();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(clave);
      req.onsuccess = () => {
        const row = req.result;
        if (!row) return resolve(null);
        if (row.expira && row.expira < Date.now()) return resolve(null);
        memoria.set(clave, row);
        resolve(row.valor);
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function cacheSet(clave, valor, tipo, ttlMs) {
  const row = {
    clave,
    valor,
    tipo: tipo || "gen",
    expira: Date.now() + (ttlMs || 6 * 60 * 60 * 1000),
  };
  memoria.set(clave, row);
  const db = await abrir();
  if (!db) return;
  try {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(row);
  } catch {}
}

export async function cachePorTipo(tipo) {
  const db = await abrir();
  if (!db) {
    return [...memoria.values()].filter((r) => r.tipo === tipo).map((r) => r.valor);
  }
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, "readonly");
      const idx = tx.objectStore(STORE).index("tipo");
      const req = idx.getAll(tipo);
      req.onsuccess = () => resolve((req.result || []).map((r) => r.valor));
      req.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}
