// Consejo del día sin key ni registro:
// - Clima: Open-Meteo https://github.com/open-meteo/open-meteo
// - Feriados MX: Nager.Date https://github.com/nager/Nager.Date
// Si una base no responde se intenta la definida en OPEN_METEO_BASE_URL /
// FERIADOS_BASE_URL. Si todo falla, la app usa su aviso local (sin bloquear).

import { basesExternas, cabecerasLimite, coordenadaSegura, ipDelCliente, limiteDeUso } from "../../../lib/seguridad";
import { feriadoEn, interpretarClima } from "../../../lib/plan-compra";

const MAX_POR_MINUTO = 60;
const TIMEOUT_MS = 6000;

async function intentarJson(bases, ruta) {
  for (const base of bases) {
    try {
      const res = await fetch(base + ruta, {
        headers: { Accept: "application/json", "User-Agent": "DespensaMX/1.0 (comparador de despensa)" },
        next: { revalidate: 1800 },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) continue;
      return await res.json().catch(() => null);
    } catch {
      // Siguiente base.
    }
  }
  return null;
}

export async function GET(request) {
  const ip = ipDelCliente(request);
  const cupo = limiteDeUso(`plan:${ip}`, MAX_POR_MINUTO, 60_000);
  if (!cupo.permitido) {
    return Response.json(
      { clima: null, feriado: null, error: "rate-limit" },
      { status: 429, headers: cabecerasLimite(cupo, MAX_POR_MINUTO) },
    );
  }

  const params = new URL(request.url).searchParams;
  const lat = coordenadaSegura(params.get("lat"), -90, 90);
  const lon = coordenadaSegura(params.get("lon"), -180, 180);
  if (lat == null || lon == null) {
    return Response.json({ clima: null, feriado: null, error: "Coordenadas no válidas." }, { status: 400 });
  }

  const ahora = new Date();
  const basesClima = basesExternas(process.env.OPEN_METEO_BASE_URL, "https://api.open-meteo.com/v1");
  const basesFeriados = basesExternas(process.env.FERIADOS_BASE_URL, "https://date.nager.at/api/v3");

  const [datosClima, datosFeriados] = await Promise.all([
    intentarJson(
      basesClima,
      `/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=precipitation_probability_max&timezone=auto&forecast_days=1`,
    ),
    intentarJson(basesFeriados, `/publicholidays/${ahora.getFullYear()}/MX`),
  ]);

  const clima = interpretarClima(datosClima);
  const feriado = feriadoEn(datosFeriados, ahora);
  if (!clima && !feriado) {
    return Response.json({ clima: null, feriado: null, error: "upstream" }, { status: 502 });
  }
  return Response.json(
    { clima, feriado, fuentes: ["open-meteo", "nager.date"] },
    { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" } },
  );
}
