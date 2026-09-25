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
  const clave =
    "overpass:" + radioM + ":" + Number(lat).toFixed(3) + "," + Number(lon).toFixed(3);
  try {
    const { cacheGet, cacheSet } = await import("./cache");
    const hit = await cacheGet(clave);
    if (hit && hit.length) return hit;
    const lista = await consultarOverpass(lat, lon, radioM);
    await cacheSet(clave, lista, "overpass", 30 * 60 * 1000);
    return lista;
  } catch {
    return consultarOverpass(lat, lon, radioM);
  }
}

async function consultarOverpass(lat, lon, radioM) {
  const q = `[out:json][timeout:25];(node["shop"~"supermarket|wholesale|convenience"](around:${radioM},${lat},${lon});way["shop"~"supermarket|wholesale"](around:${radioM},${lat},${lon}););out center 40;`;
  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: "data=" + encodeURIComponent(q),
  });
  if (!res.ok) throw new Error("No pude consultar el mapa ahora. Intenta de nuevo.");
  const data = await res.json();
  const seen = new Set();
  return (data.elements || [])
    .map((el) => {
      const plat = el.lat || el.center?.lat;
      const plon = el.lon || el.center?.lon;
      const nombre = el.tags?.name || el.tags?.brand || "Supermercado";
      if (plat == null || plon == null) return null;
      return {
        id: String(el.id),
        nombre,
        known: esCadenaConocida(nombre),
        cadenaId: cadenaDesdeNombre(nombre),
        lat: plat,
        lon: plon,
        km: Number(distanciaKm(lat, lon, plat, plon).toFixed(2)),
      };
    })
    .filter(Boolean)
    .filter((s) => {
      const key = s.nombre.toLowerCase() + s.km;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.km - b.km)
    .slice(0, 20);
}
