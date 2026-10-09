/**
 * Caché local con IndexedDB e índices (tipo, expira).
 * Sirve las sugerencias de Open Food Facts y resultados de Overpass.
 * Si IndexedDB no existe, cae a memoria. Las entradas caducadas se borran del
 * almacenamiento persistente cuando se abre la base y cada vez que se accede.
 */

const DB_NAME = "despensa-mx-cache";
const DB_VER = 1;
const STORE = "entradas";
const MAX_MEMORIA = 500;
const memoria = new Map();
let dbPromise;

function guardarEnMemoria(clave, fila) {
  const ahora = Date.now();
  for (const [key, value] of memoria) {
    if (value.expira <= ahora) memoria.delete(key);
  }
  if (!memoria.has(clave) && memoria.size >= MAX_MEMORIA) {
    const masVieja = memoria.keys().next().value;
    if (masVieja != null) memoria.delete(masVieja);
  }
  // Mover una clave renovada al final para tener un FIFO pequeño y predecible.
  memoria.delete(clave);
  memoria.set(clave, fila);
}

function borrarCaducadas(db) {
  if (!db || typeof IDBKeyRange === "undefined") return;
  try {
    const tx = db.transaction(STORE, "readwrite");
    const indice = tx.objectStore(STORE).index("expira");
    const cursor = indice.openCursor(IDBKeyRange.upperBound(Date.now()));
    cursor.onsuccess = () => {
      const entrada = cursor.result;
      if (!entrada) return;
      entrada.delete();
      entrada.continue();
    };
  } catch {
    // La caché no debe romper la app si IndexedDB está bloqueada o llena.
  }
}

function abrir() {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve) => {
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
      req.onsuccess = () => {
        const db = req.result;
        db.onversionchange = () => {
          db.close();
          dbPromise = null;
        };
        borrarCaducadas(db);
        resolve(db);
      };
      req.onerror = () => {
        dbPromise = null;
        resolve(null);
      };
      req.onblocked = () => {
        dbPromise = null;
        resolve(null);
      };
    } catch {
      dbPromise = null;
      resolve(null);
    }
  });
  return dbPromise;
}

function borrarClave(db, clave) {
  try {
    db.transaction(STORE, "readwrite").objectStore(STORE).delete(clave);
  } catch {
    // Mejor dejar una entrada vieja que interrumpir la búsqueda.
  }
}

export async function cacheGet(clave) {
  const ahora = Date.now();
  if (memoria.has(clave)) {
    const hit = memoria.get(clave);
    if (hit.expira > ahora) return hit.valor;
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
        if (!row.expira || row.expira <= ahora) {
          borrarClave(db, clave);
          return resolve(null);
        }
        guardarEnMemoria(clave, row);
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
  guardarEnMemoria(clave, row);
  const db = await abrir();
  if (!db) return;
  try {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(row);
    borrarCaducadas(db);
  } catch {
    /* ignore quota */
  }
}
