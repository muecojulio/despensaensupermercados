// Open Food Facts por código de barras (sin key ni registro):
// https://github.com/openfoodfacts/openfoodfacts-server
// Si la base pública no responde, se intenta la base de
// OPENFOODFACTS_BASE_URL (si está definida) y el subdominio de México.

import { basesExternas, cabecerasLimite, ipDelCliente, limiteDeUso } from "../../../lib/seguridad";
import { codigoConChecksumValido, interpretarProductoOff, normalizarCodigo } from "../../../lib/codigo-barras";

const MAX_POR_MINUTO = 60;
const TIMEOUT_MS = 8000;

export async function GET(request) {
  const ip = ipDelCliente(request);
  const cupo = limiteDeUso(`codigo:${ip}`, MAX_POR_MINUTO, 60_000);
  if (!cupo.permitido) {
    return Response.json(
      { producto: null, error: "Muchas consultas seguidas. Espera un minuto." },
      { status: 429, headers: cabecerasLimite(cupo, MAX_POR_MINUTO) },
    );
  }

  const codigo = normalizarCodigo(new URL(request.url).searchParams.get("codigo"));
  if (!codigo || !codigoConChecksumValido(codigo)) {
    return Response.json({ producto: null, error: "Código de barras no válido." }, { status: 400 });
  }

  const bases = basesExternas(
    process.env.OPENFOODFACTS_BASE_URL,
    "https://world.openfoodfacts.org",
    "https://mx.openfoodfacts.org",
  );

  for (const base of bases) {
    try {
      const res = await fetch(`${base}/api/v2/product/${encodeURIComponent(codigo)}.json`, {
        headers: {
          "User-Agent": "DespensaMX/1.0 (comparador de despensa; +https://openfoodfacts.org)",
          Accept: "application/json",
        },
        next: { revalidate: 43200 },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) continue;
      const producto = interpretarProductoOff(await res.json().catch(() => null));
      // status 0 de OFF = "no existe": es respuesta válida, no un fallo de red.
      return Response.json(
        { producto, fuente: "openfoodfacts" },
        { headers: { "Cache-Control": "public, s-maxage=43200, stale-while-revalidate=86400" } },
      );
    } catch {
      // Se prueba la siguiente base; si ninguna responde, cae al 502 de abajo.
    }
  }
  return Response.json(
    { producto: null, error: "Open Food Facts no respondió. Intenta de nuevo en un momento." },
    { status: 502 },
  );
}
