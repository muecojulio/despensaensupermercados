import { MARCAS_POR_PRODUCTO, PRECIO_RELATIVO_MARCA, nivelDeMarca } from "../data/marcas.js";

/**
 * Sugerencias de marcas alternativas más baratas del mismo producto.
 *
 * Los precios del catálogo son de referencia por tienda y no distinguen
 * marca, así que el ahorro se ESTIMA con el precio relativo de cada marca
 * (data/marcas.js): si hoy pagas una premium (factor 1.10) y cambias a la
 * marca propia (0.82), el estimado es precio × 0.82 / 1.10. Hay que
 * confirmarlo en el anaquel; la UI lo dice siempre junto a la cifra.
 */

function claveMarca(marca) {
  return String(marca || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

const FACTORES = new Map(
  Object.entries(PRECIO_RELATIVO_MARCA).map(([marca, factor]) => [claveMarca(marca), factor]),
);

/** Factor de precio relativo de una marca; 1 = estándar, sin marca = 1. */
export function factorMarca(marca) {
  if (!marca) return 1;
  const clave = claveMarca(marca);
  if (FACTORES.has(clave)) return FACTORES.get(clave);
  // Respaldo por si llega una marca de Open Food Facts que no está en la tabla.
  if (clave.includes("great value") || clave.includes("marca propia") || clave.includes("aurrera")) return 0.82;
  return 1;
}

export { nivelDeMarca };

const redondear = (n) => Math.round(n * 100) / 100;

/**
 * Alternativas más baratas que `marcaActual` para el mismo producto,
 * ordenadas de la más barata a la menos. Sin marca elegida, la referencia
 * es una marca estándar (factor 1): solo se sugieren las económicas.
 *
 * @param {string} productoId id del catálogo (data/catalogo.js)
 * @param {object} [opciones]
 * @param {string} [opciones.marcaActual] marca elegida hoy ("" = ninguna)
 * @param {number|null} [opciones.precioUnitario] precio por pieza en la tienda
 * @param {number} [opciones.cantidad] piezas en la lista
 * @param {number} [opciones.limite] máximo de sugerencias
 * @returns {{marca:string, factor:number, nivel:string, ahorroPct:number,
 *   precioEstimado:number|null, ahorroEstimado:number|null}[]}
 */
export function alternativasMasBaratas(productoId, opciones = {}) {
  const { marcaActual = "", precioUnitario = null, cantidad = 1, limite = 3 } = opciones;
  const factorActual = factorMarca(marcaActual);
  const candidatas = MARCAS_POR_PRODUCTO[productoId] || [];

  return candidatas
    .filter((marca) => claveMarca(marca) !== claveMarca(marcaActual))
    .map((marca) => {
      const factor = factorMarca(marca);
      const precioEstimado = precioUnitario != null && precioUnitario > 0
        ? redondear((precioUnitario * factor) / factorActual)
        : null;
      return {
        marca,
        factor,
        nivel: nivelDeMarca(factor),
        ahorroPct: Math.max(0, Math.round((1 - factor / factorActual) * 100)),
        precioEstimado,
        ahorroEstimado: precioEstimado != null
          ? redondear((precioUnitario - precioEstimado) * Math.max(1, Number(cantidad) || 1))
          : null,
      };
    })
    .filter((alt) => alt.factor < factorActual - 0.001 && alt.ahorroPct >= 3)
    .sort((a, b) => a.factor - b.factor || a.marca.localeCompare(b.marca, "es-MX"))
    .slice(0, Math.max(1, limite));
}

/**
 * La sugerencia con más ahorro para un renglón del ticket de la tienda
 * ganadora (detalle de `comparar`), o null si ya lleva la opción barata.
 */
export function sugerenciaParaRenglon(renglon, marcaActual = "") {
  if (!renglon?.producto || renglon.subtotal == null || renglon.omitido) return null;
  const cantidad = Math.max(1, Number(renglon.cantidad) || 1);
  const unitario = renglon.subtotal / cantidad;
  const [mejor] = alternativasMasBaratas(renglon.producto.id, {
    marcaActual, precioUnitario: unitario, cantidad, limite: 1,
  });
  if (!mejor || !(mejor.ahorroEstimado > 0)) return null;
  return { producto: renglon.producto, marcaActual: marcaActual || "marca estándar", ...mejor };
}

/** Sugerencias de todo el ticket, de mayor a menor ahorro estimado. */
export function sugerenciasDeTicket(detalle, marcasElegidas = {}, limite = 5) {
  return (detalle || [])
    .map((renglon) => sugerenciaParaRenglon(renglon, marcasElegidas[renglon?.producto?.id] || ""))
    .filter(Boolean)
    .sort((a, b) => b.ahorroEstimado - a.ahorroEstimado)
    .slice(0, limite);
}
