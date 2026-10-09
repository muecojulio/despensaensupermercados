// La ruta lee ?q= en cada petición, así que es dinámica por sí sola.
// El caché de datos (revalidate) evita golpear Open Food Facts en cada visita.

import { cabecerasLimite, ipDelCliente, limiteDeUso } from "../../../lib/seguridad";

const MAX_POR_MINUTO = 60;
const TIMEOUT_MS = 8000;

function limpia(s) {
  return String(s || "")
    // Sin caracteres de control: tampoco queremos mandarlos de rebote al
    // servicio de terceros.
    .replace(/[^\P{Cc}]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 48);
}

export async function GET(request) {
  const ip = ipDelCliente(request);
  const cupo = limiteDeUso(`marcas:${ip}`, MAX_POR_MINUTO, 60_000);
  if (!cupo.permitido) {
    return Response.json(
      { marcas: [], error: "rate-limit" },
      { status: 429, headers: cabecerasLimite(cupo, MAX_POR_MINUTO) },
    );
  }

  const q = limpia(new URL(request.url).searchParams.get("q"));
  if (q.length < 2) {
    return Response.json({ marcas: [] });
  }

  const url =
    "https://world.openfoodfacts.org/cgi/search.pl?search_terms=" +
    encodeURIComponent(q) +
    "&search_simple=1&action=process&json=1&page_size=20&cc=mx&lc=es";

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "DespensaMX/1.0 (comparador de despensa; +https://openfoodfacts.org)",
        Accept: "application/json",
      },
      next: { revalidate: 43200 },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      return Response.json({ marcas: [], fuente: "openfoodfacts", error: "upstream" });
    }
    const data = await res.json();
    const seen = new Set();
    const marcas = [];
    for (const p of data.products || []) {
      const brand = limpia((p.brands || "").split(",")[0]);
      if (!brand) continue;
      const key = brand.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      marcas.push(brand);
      if (marcas.length >= 12) break;
    }
    return Response.json(
      { marcas, fuente: "openfoodfacts" },
      {
        headers: {
          "Cache-Control": "public, s-maxage=43200, stale-while-revalidate=86400",
        },
      },
    );
  } catch {
    return Response.json({ marcas: [] });
  }
}
