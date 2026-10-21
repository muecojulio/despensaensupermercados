import { cacheGet, cacheSet } from "./cache.js";

/**
 * Código de barras → producto, con Open Food Facts (sin key ni registro).
 * Proyecto público: https://github.com/openfoodfacts/openfoodfacts-server
 * (endpoint `/api/v2/product/{codigo}.json`, el mismo que usa /api/marcas).
 *
 * La validación del dígito verificador (EAN-8/UPC-A/EAN-13) se hace en el
 * dispositivo/servidor antes de gastar una llamada: un código tecleado con un
 * número mal no debe salir a la red.
 */

/** Solo dígitos, de 8 a 14 (EAN-8, UPC-A, EAN-13 y GTIN-14 cortos). */
export function normalizarCodigo(valor) {
  const digitos = String(valor || "").replace(/\D/g, "");
  return /^[0-9]{8,14}$/.test(digitos) ? digitos : "";
}

/** Dígito verificador GTIN: pesos 3/1 alternados desde la derecha. */
export function codigoConChecksumValido(codigo) {
  const c = normalizarCodigo(codigo);
  if (!c) return false;
  let suma = 0;
  for (let i = 0; i < c.length - 1; i++) {
    const digito = Number(c[c.length - 2 - i]);
    suma += digito * (i % 2 === 0 ? 3 : 1);
  }
  const esperado = (10 - (suma % 10)) % 10;
  return esperado === Number(c[c.length - 1]);
}

/**
 * Forma segura y pequeña de un producto de Open Food Facts.
 * Nunca se devuelve el JSON crudo del tercero al navegador.
 */
export function interpretarProductoOff(data) {
  if (!data || Number(data.status) !== 1 || !data.product) return null;
  const p = data.product;
  const texto = (v, max = 90) =>
    String(v || "").replace(/[^\P{Cc}]/gu, "").replace(/\s+/g, " ").trim().slice(0, max);
  const nombre = texto(p.product_name_es || p.product_name || p.generic_name_es || p.generic_name);
  if (!nombre) return null;
  const marcas = texto(p.brands, 60)
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean)
    .slice(0, 3);
  const nutriscore = texto(p.nutriscore_grade, 1).toLowerCase();
  return {
    codigo: texto(data.code, 14),
    nombre,
    marcas,
    cantidadTexto: texto(p.quantity, 30),
    nutriscore: /^[a-e]$/.test(nutriscore) ? nutriscore.toUpperCase() : null,
    fuente: "openfoodfacts",
  };
}

/** Cliente: pasa por /api/producto-codigo (rate-limit + respaldo en el servidor). */
export async function buscarProductoPorCodigo(codigoCrudo) {
  const codigo = normalizarCodigo(codigoCrudo);
  if (!codigo) throw new Error("Escribe el código de barras (8 a 14 números).");
  if (!codigoConChecksumValido(codigo)) {
    throw new Error("Ese código no cuadra: revisa el último número e inténtalo de nuevo.");
  }
  const clave = "codigo:" + codigo;
  const cached = await cacheGet(clave);
  if (cached) return cached;

  const res = await fetch("/api/producto-codigo?codigo=" + encodeURIComponent(codigo));
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "No pude consultar ese código. Intenta de nuevo.");
  if (!data.producto) return null;
  await cacheSet(clave, data.producto, "codigo", 12 * 60 * 60 * 1000);
  return data.producto;
}
