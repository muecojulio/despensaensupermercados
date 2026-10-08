const CADENAS = [
  "walmart",
  "bodega",
  "aurrera",
  "soriana",
  "chedraui",
  "comer",
  "fresko",
  "city market",
  "city club",
  "costco",
  "sam's",
  "sams",
  "neto",
  "3b",
  "issste",
  "sumesa",
  "selecto",
];

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

export function distanciaKm(aLat, aLon, bLat, bLon) {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function esCadenaConocida(nombre) {
  const n = String(nombre || "").toLowerCase();
  return CADENAS.some((c) => n.includes(c));
}

export function cadenaDesdeNombre(nombre) {
  const n = String(nombre || "").toLowerCase();
  if (n.includes("bodega") || n.includes("aurrera")) return "bodega";
  if (n.includes("walmart express")) return "walmart_express";
  if (n.includes("walmart")) return "walmart";
  if (n.includes("mega") && n.includes("soriana")) return "mega_soriana";
  if (n.includes("soriana")) return "soriana";
  if (n.includes("selecto")) return "chedraui_selecto";
  if (n.includes("chedraui")) return "chedraui";
  if (n.includes("city market")) return "city_market";
  if (n.includes("city club")) return "city_club";
  if (n.includes("fresko")) return "fresko";
  if (n.includes("la comer") || n.includes("lacomer") || n.includes("comer")) return "la_comer";
  if (n.includes("costco")) return "costco";
  if (n.includes("sam")) return "sams";
  if (n.includes("neto")) return "neto";
  if (n.includes("3b") || n.includes("tiendas 3")) return "3b";
  if (n.includes("issste")) return "superissste";
  if (n.includes("sumesa")) return "sumesa";
  return null;
}

export async function buscarSupersCercanos(lat, lon, radioM = 4000) {
  lat = Number(lat);
  lon = Number(lon);
  radioM = Number(radioM);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    throw new Error("No pude leer una ubicación válida.");
  }
  if (!Number.isFinite(radioM) || radioM <= 0) {
    throw new Error("El radio de búsqueda no es válido.");
  }

  // La versión evita reutilizar resultados guardados por la consulta anterior,
  // que limitaba la respuesta a 40 elementos.
  const clave = `overpass:v2:${radioM}:${lat.toFixed(4)},${lon.toFixed(4)}`;
  let cache;
  try {
    cache = await import("./cache");
    const hit = await cache.cacheGet(clave);
    if (Array.isArray(hit) && hit.length) return hit;
  } catch {
    // La búsqueda debe continuar aunque IndexedDB no esté disponible.
  }

  const lista = await consultarOverpass(lat, lon, radioM);
  try {
    // No cachear búsquedas vacías permite verificar de nuevo si ya hay datos nuevos.
    if (lista.length) await cache?.cacheSet(clave, lista, "overpass", 15 * 60 * 1000);
  } catch {
    // El caché es opcional; no debe convertir una búsqueda válida en error.
  }
  return lista;
}

async function consultarOverpass(lat, lon, radioM) {
  const q = `[out:json][timeout:25];(nwr["shop"~"^(supermarket|wholesale|convenience)$"](around:${radioM},${lat},${lon}););out center;`;
  let ultimoError;

  // Si un servidor de Overpass está ocupado o falla, intenta con otro. Una
  // respuesta vacía solo se acepta si el servidor contestó correctamente.
  for (const endpoint of OVERPASS_ENDPOINTS) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body: new URLSearchParams({ data: q }).toString(),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data.elements) || data.remark) {
        throw new Error(data.remark || "Respuesta incompleta del mapa");
      }
      return normalizarLugares(data.elements, lat, lon, radioM);
    } catch (error) {
      ultimoError = error;
    } finally {
      clearTimeout(timeout);
    }
  }

  const detalle = ultimoError?.name === "AbortError"
    ? "La consulta tardó demasiado."
    : "El servicio del mapa no respondió correctamente.";
  throw new Error(`No pude confirmar si hay súpers cerca. ${detalle} Intenta de nuevo en un momento.`);
}

function normalizarLugares(elementos, lat, lon, radioM) {
  const seen = new Set();
  return elementos
    .map((el) => {
      const plat = Number(el.lat ?? el.center?.lat);
      const plon = Number(el.lon ?? el.center?.lon);
      const nombre = el.tags?.name || el.tags?.brand || "Supermercado";
      if (!Number.isFinite(plat) || !Number.isFinite(plon)) return null;
      const distancia = distanciaKm(lat, lon, plat, plon);
      if (distancia > radioM / 1000 + 0.01) return null;
      return {
        id: String(el.id),
        nombre,
        known: esCadenaConocida(nombre),
        cadenaId: cadenaDesdeNombre(nombre),
        lat: plat,
        lon: plon,
        km: Number(distancia.toFixed(2)),
      };
    })
    .filter(Boolean)
    .filter((s) => {
      const key = `${s.nombre.toLocaleLowerCase("es-MX")}:${s.lat.toFixed(5)},${s.lon.toFixed(5)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.km - b.km)
    .slice(0, 20);
}
