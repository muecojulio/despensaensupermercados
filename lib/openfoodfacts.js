import { cacheGet, cacheSet } from "./cache";

/**
 * Open Food Facts — API pública sin registro.
 * Proyecto: https://github.com/openfoodfacts/openfoodfacts-server
 */
export async function buscarMarcasOff(query) {
  const q = String(query || "").trim();
  if (q.length < 2) return [];
  const clave = "off:" + q.toLowerCase();
  const cached = await cacheGet(clave);
  if (cached) return cached;

  const res = await fetch("/api/marcas?q=" + encodeURIComponent(q));
  if (!res.ok) return [];
  const data = await res.json();
  const marcas = Array.isArray(data.marcas) ? data.marcas : [];
  await cacheSet(clave, marcas, "off", 12 * 60 * 60 * 1000);
  return marcas;
}
