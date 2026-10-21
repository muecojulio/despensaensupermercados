// Dirección → coordenadas con Nominatim / OpenStreetMap (sin key):
// https://github.com/openstreetmap/Nominatim
// Política de uso de Nominatim: máximo ~1 petición/s por cliente y caché de
// resultados; por eso hay rate-limit propio (30/min) y Cache-Control largo.
// Si la base pública no responde, se intenta NOMINATIM_BASE_URL si existe.

import { basesExternas, cabecerasLimite, ipDelCliente, limiteDeUso } from "../../../lib/seguridad";

const MAX_POR_MINUTO = 30;
const TIMEOUT_MS = 8000;

function limpia(s) {
  return String(s || "")
    .replace(/[^\P{Cc}]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 90);
}

export async function GET(request) {
  const ip = ipDelCliente(request);
  const cupo = limiteDeUso(`geo:${ip}`, MAX_POR_MINUTO, 60_000);
  if (!cupo.permitido) {
    return Response.json(
      { error: "Muchas búsquedas seguidas. Espera un minuto." },
      { status: 429, headers: cabecerasLimite(cupo, MAX_POR_MINUTO) },
    );
  }

  const q = limpia(new URL(request.url).searchParams.get("q"));
  if (q.length < 3) {
    return Response.json({ error: "Escribe una colonia, calle o alcaldía." }, { status: 400 });
  }

  const bases = basesExternas(process.env.NOMINATIM_BASE_URL, "https://nominatim.openstreetmap.org");
  const ruta =
    `/search?format=jsonv2&limit=1&countrycodes=mx&accept-language=es&q=` +
    encodeURIComponent(q + ", México");

  for (const base of bases) {
    try {
      const res = await fetch(base + ruta, {
        headers: {
          Accept: "application/json",
          // Nominatim exige identificarse; nunca se manda la IP del usuario
          // como Referer ni datos de su lista.
          "User-Agent": "DespensaMX/1.0 (comparador de despensa; contacto vía repo del proyecto)",
        },
        next: { revalidate: 86400 },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) continue;
      const lista = await res.json().catch(() => null);
      const hit = Array.isArray(lista) ? lista[0] : null;
      const lat = Number(hit?.lat);
      const lon = Number(hit?.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        return Response.json({ error: "No encontré esa dirección. Prueba con colonia y alcaldía." }, { status: 404 });
      }
      return Response.json(
        { lat, lon, etiqueta: limpia(hit.display_name).slice(0, 120), fuente: "nominatim" },
        { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } },
      );
    } catch {
      // Siguiente base.
    }
  }
  return Response.json({ error: "El buscador de direcciones no respondió. Intenta de nuevo." }, { status: 502 });
}
