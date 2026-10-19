import test from "node:test";
import assert from "node:assert/strict";
import { comparar, parsearLista } from "../lib/despensa.js";
import { TIENDAS } from "../data/catalogo.js";
import { alternativasMasBaratas, factorMarca, sugerenciasDeTicket } from "../lib/marcas.js";
import { escaparCsv, listaOptimizada, listaOptimizadaACsv, nombreArchivoExportacion, rankingACsv } from "../lib/exportar.js";

const items = parsearLista("2 leche\n1 refresco\n1 arroz");
const antojos = { "linea-1": true }; // el refresco

test("modo solo antojos: la despensa no suma ni entra al total", () => {
  const [r] = comparar(items, [TIENDAS[0]], [], { antojoIds: antojos, modo: "antojos" });
  assert.equal(r.modo, "antojos");
  assert.equal(r.totalBase, 0);
  assert.equal(r.total, r.totalAntojo);
  assert.ok(r.total > 0);
  assert.equal(r.detalle.filter((d) => d.fueraDeModo).length, 2);
  assert.equal(r.cubreTodo, true);
});

test("modo solo despensa: los antojos quedan fuera del presupuesto principal", () => {
  const [r] = comparar(items, [TIENDAS[0]], [], { antojoIds: antojos, modo: "despensa" });
  assert.equal(r.totalAntojo, 0);
  assert.equal(r.total, r.totalBase);
  const [todo] = comparar(items, [TIENDAS[0]], [], { antojoIds: antojos, modo: "todo" });
  assert.ok(r.total < todo.total);
  assert.equal(todo.total, Math.round((todo.totalBase + todo.totalAntojo) * 100) / 100);
});

test("modo solo antojos sin antojos marcados no cubre nada", () => {
  const [r] = comparar(items, [TIENDAS[0]], [], { antojoIds: {}, modo: "antojos" });
  assert.equal(r.total, 0);
  assert.equal(r.cubreTodo, false);
});

test("marcas: la marca propia es más barata que la premium del mismo producto", () => {
  assert.ok(factorMarca("Great Value") < factorMarca("Santa Clara"));
  assert.equal(factorMarca(""), 1);
  const alts = alternativasMasBaratas("leche_1l", { marcaActual: "Santa Clara", precioUnitario: 22, cantidad: 2 });
  assert.ok(alts.length >= 1);
  assert.ok(alts.every((a) => a.ahorroPct >= 3 && a.precioEstimado < 22));
  assert.equal(alts[0].marca, "Aurrerá"); // la de menor factor en leche
  assert.ok(alts[0].ahorroEstimado > 0);
});

test("marcas: sin marca elegida solo se sugieren económicas y ya barata no sugiere", () => {
  const alts = alternativasMasBaratas("aceite_1l", { marcaActual: "", precioUnitario: 40 });
  assert.ok(alts.every((a) => a.factor < 1));
  assert.deepEqual(alternativasMasBaratas("aceite_1l", { marcaActual: "Great Value", precioUnitario: 40 }), []);
});

test("sugerencias del ticket ordenan por ahorro estimado", () => {
  const [r] = comparar(items, [TIENDAS[0]], [], { antojoIds: antojos });
  const s = sugerenciasDeTicket(r.detalle, { leche_1l: "Santa Clara" });
  assert.ok(s.length >= 1);
  assert.equal(s[0].producto.id, "leche_1l");
  assert.ok(s[0].ahorroEstimado >= s[s.length - 1].ahorroEstimado);
});

test("csv: escapa comillas y punto y coma, y lleva BOM para Excel", () => {
  assert.equal(escaparCsv('a;b'), '"a;b"');
  assert.equal(escaparCsv('dijo "hola"'), '"dijo ""hola"""');
  const ranking = comparar(items, TIENDAS.slice(0, 2), [], { antojoIds: antojos, modo: "antojos" });
  const csv = rankingACsv(ranking, { nombreLista: "Prueba", modo: "antojos" });
  assert.ok(csv.startsWith("﻿"));
  assert.match(csv, /Solo antojos/);
  assert.match(csv, /Posición;Tienda;Total/);
});

test("lista optimizada: por pasillo, sin omitidos ni fuera de modo", () => {
  const [r] = comparar(items, [TIENDAS[0]], [], { antojoIds: antojos, modo: "antojos", skipIds: {} });
  const lista = listaOptimizada(r, { refresco: "Coca-Cola" });
  assert.equal(lista.length, 1); // solo el antojo entra en este modo
  assert.equal(lista[0].productoId, "refresco");
  assert.equal(lista[0].marca, "Coca-Cola");
  const csv = listaOptimizadaACsv(r, { marcas: { refresco: "Coca-Cola" }, modo: "antojos" });
  assert.match(csv, /Cantidad;Producto;Marca/);
  assert.match(csv, /Coca-Cola/);
});

test("nombre de archivo exportado es seguro y con fecha", () => {
  assert.equal(nombreArchivoExportacion("Mi Despensa Semanal", "csv", new Date("2026-10-19T12:00:00Z")), "mi-despensa-semanal-2026-10-19.csv");
});
