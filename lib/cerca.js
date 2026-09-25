const CADENAS = [
  "walmart",
  "aurrera",
  "soriana",
  "chedraui",
  "la comer",
  "fresko",
  "city market",
  "costco",
  "sam's",
  "sams",
  "city club",
  "issste",
  "sumesa",
  "3b",
  "neto",
  "bodega",
];

export function distanciaKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function nombreDe(el) {
  return el.tags?.name || el.tags?.brand || el.tags?.operator || "Súper";
}

export function esCadenaConocida(nombre) {
  const n = String(nombre || "").toLowerCase();
  return CADENAS.some((c) => n.includes(c));
}

export async function buscarSupersCerca(lat, lon, radio = 3500) {
  const q = `[out:json][timeout:25];(nwr["shop"="supermarket"](around:${radio},${lat},${lon});nwr["shop"="wholesale"](around:${radio},${lat},${lon});nwr["shop"="convenience"]["name"~"3B|Neto|Aurrera",i](around:${radio},${lat},${lon}););out center 40;`;
  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body: "data=" + encodeURIComponent(q),
  });
  if (!res.ok) throw new Error("No pude consultar el mapa ahora. Intenta de nuevo.");
  const data = await res.json();
  const yo = { lat, lon };
  return (data.elements || [])
    .map((el) => {
      const lat2 = el.lat || el.center?.lat;
      const lon2 = el.lon || el.center?.lon;
      if (lat2 == null || lon2 == null) return null;
      const nombre = nombreDe(el);
      return {
        id: String(el.id),
        nombre,
        conocida: esCadenaConocida(nombre),
        lat: lat2,
        lon: lon2,
        km: Number(distanciaKm(yo, { lat: lat2, lon: lon2 }).toFixed(2)),
        maps:
          "https://www.google.com/maps/dir/?api=1&destination=" +
          encodeURIComponent(lat2 + "," + lon2),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.km - b.km)
    .slice(0, 20);
}

export function pedirUbicacion() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Este celular no comparte ubicación."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => reject(new Error("No diste permiso de ubicación, o falló el GPS.")),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  });
}
