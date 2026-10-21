import { cacheGet, cacheSet } from "./cache.js";

/**
 * Consejo del día para ir por la despensa, sin key ni registro:
 * - Clima: Open-Meteo — https://github.com/open-meteo/open-meteo
 *   (`api.open-meteo.com/v1/forecast`, gratuito sin registro).
 * - Feriados de México: Nager.Date — https://github.com/nager/Nager.Date
 *   (`date.nager.at/api/v3/publicholidays/{año}/MX`).
 *
 * Todo pasa por /api/plan-compra: si ninguna responde, la app sigue con el
 * aviso local por día/quincena (`avisoDiaCompra` en data/compras.js). Nada de
 * esto bloquea la comparación de precios.
 */

/** Interpreta la respuesta de Open-Meteo a una forma pequeña y segura. */
export function interpretarClima(data) {
  const actual = data?.current;
  if (!actual || !Number.isFinite(Number(actual.temperature_2m))) return null;
  const probHoy = Number(data?.daily?.precipitation_probability_max?.[0]);
  return {
    temperatura: Math.round(Number(actual.temperature_2m)),
    codigoClima: Number.isFinite(Number(actual.weather_code)) ? Number(actual.weather_code) : null,
    probLluviaHoy: Number.isFinite(probHoy) ? Math.max(0, Math.min(100, Math.round(probHoy))) : null,
  };
}

/** Feriado de hoy (o null) desde la lista anual de Nager.Date. */
export function feriadoEn(lista, fecha = new Date()) {
  if (!Array.isArray(lista)) return null;
  const iso = [
    fecha.getFullYear(),
    String(fecha.getMonth() + 1).padStart(2, "0"),
    String(fecha.getDate()).padStart(2, "0"),
  ].join("-");
  const hit = lista.find((f) => f && f.date === iso);
  if (!hit) return null;
  const nombre = String(hit.localName || hit.name || "Feriado").replace(/[^\P{Cc}]/gu, "").trim().slice(0, 60);
  return nombre ? { fecha: iso, nombre } : null;
}

/**
 * Texto corto del consejo combinando clima + feriado. Puro y probado:
 * devuelve "" si no hay nada que valga la pena avisar.
 */
export function textoConsejo({ clima = null, feriado = null } = {}) {
  const partes = [];
  if (feriado) {
    partes.push(`Hoy es feriado (${feriado.nombre}): puede haber más gente y algunas sucursales cierran temprano.`);
  }
  if (clima) {
    if (clima.probLluviaHoy != null && clima.probLluviaHoy >= 50) {
      partes.push(`Probabilidad de lluvia hoy: ${clima.probLluviaHoy} %. Ve temprano y lleva bolsa que no se moje.`);
    } else if (clima.temperatura >= 32) {
      partes.push(`Harán unos ${clima.temperatura} °C: compra los refrigerados al final y llévalos directo a casa.`);
    } else if (clima.temperatura <= 8) {
      partes.push(`Harán unos ${clima.temperatura} °C: abrígate, pero es buen momento para ir sin filas.`);
    }
  }
  return partes.join(" ");
}

/**
 * Cliente: consejo cacheado 30 min (IndexedDB, tipo "clima").
 * Si la red o la ruta fallan, devuelve null y manda el aviso local.
 */
export async function consejoDelDia(lat, lon) {
  const la = Number(lat);
  const lo = Number(lon);
  if (!Number.isFinite(la) || !Number.isFinite(lo)) return null;
  const clave = `plan:${la.toFixed(2)},${lo.toFixed(2)}`;
  const cached = await cacheGet(clave);
  if (cached) return cached;

  try {
    const res = await fetch(`/api/plan-compra?lat=${encodeURIComponent(la)}&lon=${encodeURIComponent(lo)}`);
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    if (!data || (!data.clima && !data.feriado)) return null;
    const salida = { clima: data.clima || null, feriado: data.feriado || null, texto: textoConsejo(data) };
    await cacheSet(clave, salida, "clima", 30 * 60 * 1000);
    return salida;
  } catch {
    return null;
  }
}
