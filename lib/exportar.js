import { NOMBRE_PASILLO, ORDEN_PASILLO } from "../data/compras.js";

/**
 * Exportación local (sin servidor): ranking de tiendas y lista optimizada
 * a CSV o a imagen PNG. Todo se genera en el dispositivo con los precios
 * de referencia ya calculados; nada sale a la red.
 *
 * El CSV usa ";" y coma decimal para que Excel en es-MX lo abra en
 * columnas sin pelearse, y lleva BOM para que respete los acentos.
 */

export const ETIQUETA_MODO = {
  todo: "Todo junto",
  despensa: "Solo despensa (sin antojos)",
  antojos: "Solo antojos",
};

const money = (n) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n || 0);
const numeroCsv = (n) => (n == null || Number.isNaN(Number(n)) ? "" : Number(n).toFixed(2).replace(".", ","));

export function escaparCsv(valor) {
  const texto = String(valor ?? "");
  return /[";\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

const filaCsv = (celdas) => celdas.map(escaparCsv).join(";");

/** Renglones de la lista optimizada: lo que sí se compra en la ganadora, por pasillo. */
export function listaOptimizada(ganadora, marcasElegidas = {}) {
  if (!ganadora?.detalle) return [];
  return ganadora.detalle
    .filter((d) => d.producto && d.subtotal != null && !d.omitido && !d.fueraDeModo)
    .map((d) => {
      const cantidad = Math.max(1, Number(d.cantidad) || 1);
      return {
        cantidad,
        producto: d.producto.nombre,
        productoId: d.producto.id,
        emoji: d.producto.emoji || "",
        marca: marcasElegidas[d.producto.id] || "",
        unidad: d.producto.unidad || "",
        pasillo: NOMBRE_PASILLO[d.producto.categoria] || "Otros",
        ordenPasillo: ORDEN_PASILLO[d.producto.categoria] || 99,
        precioUnitario: Math.round((d.subtotal / cantidad) * 100) / 100,
        subtotal: d.subtotal,
        antojo: !!d.antojo,
        oferta: !!d.oferta,
      };
    })
    .sort((a, b) => a.ordenPasillo - b.ordenPasillo || a.producto.localeCompare(b.producto, "es-MX"));
}

export function rankingACsv(ranking, { nombreLista = "Despensa", modo = "todo", fecha = new Date() } = {}) {
  const ganadora = ranking?.[0];
  const filas = [
    ["Despensa MX - Ranking de tiendas"],
    ["Lista", nombreLista],
    ["Modo", ETIQUETA_MODO[modo] || ETIQUETA_MODO.todo],
    ["Fecha", fecha.toLocaleString("es-MX")],
    ["Nota", "Precios de referencia, no del anaquel de hoy. Confirmar en tienda."],
    [],
    ["Posición", "Tienda", "Total", "Despensa", "Antojos", "Encontrados", "Faltantes", "Cubre todo", "Diferencia vs. ganadora"],
    ...(ranking || []).map((r, i) => [
      i + 1, r.tienda.nombre, numeroCsv(r.total), numeroCsv(r.totalBase), numeroCsv(r.totalAntojo),
      r.encontrados, r.faltantes, r.cubreTodo ? "Sí" : "No",
      numeroCsv(ganadora ? r.total - ganadora.total : 0),
    ]),
  ];
  return "﻿" + filas.map(filaCsv).join("\r\n") + "\r\n";
}

export function listaOptimizadaACsv(ganadora, { nombreLista = "Despensa", modo = "todo", marcas = {}, fecha = new Date() } = {}) {
  const renglones = listaOptimizada(ganadora, marcas);
  const filas = [
    ["Despensa MX - Lista optimizada"],
    ["Lista", nombreLista],
    ["Tienda", ganadora?.tienda?.nombre || ""],
    ["Modo", ETIQUETA_MODO[modo] || ETIQUETA_MODO.todo],
    ["Fecha", fecha.toLocaleString("es-MX")],
    ["Total", numeroCsv(ganadora?.total)],
    ["Nota", "Ordenada por pasillo. Precios de referencia; confirmar en tienda."],
    [],
    ["Cantidad", "Producto", "Marca", "Unidad", "Pasillo", "Precio unitario", "Subtotal", "Antojo", "Oferta capturada"],
    ...renglones.map((r) => [
      numeroCsv(r.cantidad), r.producto, r.marca, r.unidad, r.pasillo,
      numeroCsv(r.precioUnitario), numeroCsv(r.subtotal), r.antojo ? "Sí" : "No", r.oferta ? "Sí" : "No",
    ]),
  ];
  return "﻿" + filas.map(filaCsv).join("\r\n") + "\r\n";
}

export function nombreArchivoExportacion(base, extension, fecha = new Date()) {
  const sello = fecha.toISOString().slice(0, 10);
  const limpio = String(base || "despensa")
    .toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "despensa";
  return `${limpio}-${sello}.${extension}`;
}

/** Descarga un texto (CSV) en el navegador. Solo cliente. */
export function descargarTexto(nombre, texto, tipo = "text/csv;charset=utf-8") {
  const blob = new Blob([texto], { type: tipo });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function truncar(ctx, texto, maxAncho) {
  let t = String(texto || "");
  if (ctx.measureText(t).width <= maxAncho) return t;
  while (t.length > 1 && ctx.measureText(t + "…").width > maxAncho) t = t.slice(0, -1);
  return t + "…";
}

/**
 * Dibuja el resumen (ganadora + ranking + lista optimizada) en un canvas
 * listo para descargar o compartir como PNG. Solo cliente.
 */
export function dibujarImagenResumen({ ranking, ganadora, nombreLista = "Despensa", modo = "todo", marcas = {}, fecha = new Date() }) {
  const renglones = listaOptimizada(ganadora, marcas);
  const ANCHO = 1080;
  const MARGEN = 64;
  const altoRanking = 92 + (ranking?.length || 0) * 46;
  const altoLista = 92 + Math.max(1, renglones.length) * 46;
  const ALTO = 250 + altoRanking + altoLista + 110;

  const canvas = document.createElement("canvas");
  canvas.width = ANCHO;
  canvas.height = ALTO;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#eef5ef";
  ctx.fillRect(0, 0, ANCHO, ALTO);
  ctx.fillStyle = "#0b3527";
  ctx.fillRect(0, 0, ANCHO, 190);
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 52px system-ui, sans-serif";
  ctx.fillText("🧺 Despensa MX", MARGEN, 78);
  ctx.font = "400 30px system-ui, sans-serif";
  ctx.fillStyle = "#c9e8d4";
  ctx.fillText(truncar(ctx, `${nombreLista} · ${ETIQUETA_MODO[modo] || ""} · ${fecha.toLocaleDateString("es-MX")}`, ANCHO - MARGEN * 2), MARGEN, 126);
  if (ganadora) {
    ctx.font = "700 34px system-ui, sans-serif";
    ctx.fillStyle = "#7dd957";
    ctx.fillText(truncar(ctx, `Más barato todo junto: ${ganadora.tienda.nombre} — ${money(ganadora.total)}`, ANCHO - MARGEN * 2), MARGEN, 168);
  }

  let y = 250;
  ctx.fillStyle = "#10251c";
  ctx.font = "800 36px system-ui, sans-serif";
  ctx.fillText("Ranking de tiendas", MARGEN, y);
  y += 52;
  ctx.font = "400 29px system-ui, sans-serif";
  (ranking || []).forEach((r, i) => {
    const medalla = ["🥇", "🥈", "🥉"][i] || `${i + 1}.`;
    ctx.fillStyle = i === 0 ? "#0f7a4f" : "#10251c";
    ctx.font = `${i === 0 ? "700" : "400"} 29px system-ui, sans-serif`;
    ctx.fillText(`${medalla} ${truncar(ctx, r.tienda.nombre, 560)}`, MARGEN, y);
    ctx.textAlign = "right";
    ctx.fillText(money(r.total), ANCHO - MARGEN, y);
    ctx.textAlign = "left";
    y += 46;
  });

  y += 40;
  ctx.fillStyle = "#10251c";
  ctx.font = "800 36px system-ui, sans-serif";
  ctx.fillText(`Lista optimizada${ganadora ? " · " + ganadora.tienda.nombre : ""}`, MARGEN, y);
  y += 30;
  ctx.font = "400 24px system-ui, sans-serif";
  ctx.fillStyle = "#4d6358";
  ctx.fillText("Ordenada por pasillo para recorrer la tienda una sola vez.", MARGEN, y);
  y += 46;
  ctx.font = "400 28px system-ui, sans-serif";
  if (!renglones.length) {
    ctx.fillStyle = "#10251c";
    ctx.fillText("Sin renglones para comprar en este modo.", MARGEN, y);
    y += 46;
  }
  let pasilloActual = "";
  for (const r of renglones) {
    if (r.pasillo !== pasilloActual) {
      pasilloActual = r.pasillo;
      ctx.fillStyle = "#0e6b4c";
      ctx.font = "700 25px system-ui, sans-serif";
      ctx.fillText(pasilloActual, MARGEN, y);
      y += 40;
      ctx.font = "400 28px system-ui, sans-serif";
    }
    ctx.fillStyle = "#10251c";
    const marca = r.marca ? ` · ${r.marca}` : "";
    ctx.fillText(truncar(ctx, `☐ ${r.cantidad} × ${r.producto}${marca}${r.antojo ? " 🍭" : ""}`, 660), MARGEN + 8, y);
    ctx.textAlign = "right";
    ctx.fillText(money(r.subtotal), ANCHO - MARGEN, y);
    ctx.textAlign = "left";
    y += 46;
  }

  ctx.fillStyle = "#4d6358";
  ctx.font = "400 23px system-ui, sans-serif";
  ctx.fillText("Precios de referencia para CDMX y zona conurbada; confirma en tienda. Hecho con Despensa MX.", MARGEN, ALTO - 44);
  return canvas;
}
