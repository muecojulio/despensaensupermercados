import { PRODUCTOS } from "../data/catalogo";

function normalizar(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Índice invertido en memoria sobre el catálogo.
 * No hay base SQL: el inventario vive en JS + localStorage/IndexedDB.
 * El índice evita recorrer los 40 productos × aliases en cada renglón.
 */
const porToken = new Map();
const porId = new Map();

function tokensDe(texto) {
  return normalizar(texto)
    .split(" ")
    .filter((t) => t.length > 1);
}

function indexarProducto(prod) {
  porId.set(prod.id, prod);
  const bolsa = new Set([prod.id, prod.nombre, ...(prod.aliases || [])].flatMap(tokensDe));
  bolsa.forEach((tok) => {
    if (!porToken.has(tok)) porToken.set(tok, new Set());
    porToken.get(tok).add(prod.id);
  });
}

PRODUCTOS.forEach(indexarProducto);

export function candidatosPorNombre(nombre) {
  const toks = tokensDe(nombre);
  if (!toks.length) return PRODUCTOS;
  const conteo = new Map();
  toks.forEach((tok) => {
    const ids = porToken.get(tok);
    if (!ids) return;
    ids.forEach((id) => conteo.set(id, (conteo.get(id) || 0) + 1));
  });
  if (!conteo.size) return PRODUCTOS;
  return [...conteo.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => porId.get(id))
    .filter(Boolean);
}
