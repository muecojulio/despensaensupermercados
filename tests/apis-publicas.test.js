import test from "node:test";
import assert from "node:assert/strict";
import { basesExternas, coordenadaSegura } from "../lib/seguridad.js";
import { codigoConChecksumValido, interpretarProductoOff, normalizarCodigo } from "../lib/codigo-barras.js";
import { feriadoEn, interpretarClima, textoConsejo } from "../lib/plan-compra.js";
import { candidatosPorNombre } from "../lib/indices.js";

test("codigo de barras: normaliza y valida el dígito verificador (EAN-13/UPC)", () => {
  // 7501031311309 y 3017620422003 son GTIN con checksum correcto conocidos.
  assert.equal(normalizarCodigo(" 7501 0313 11309 "), "7501031311309");
  assert.equal(codigoConChecksumValido("7501031311309"), true);
  assert.equal(codigoConChecksumValido("3017620422003"), true);
  assert.equal(codigoConChecksumValido("7501031311300"), false); // último dígito cambiado
  assert.equal(normalizarCodigo("abc"), "");
  assert.equal(codigoConChecksumValido("123"), false);
});

test("codigo de barras: interpreta OFF y no pasa el JSON crudo", () => {
  const p = interpretarProductoOff({
    status: 1,
    code: "3017620422003",
    product: {
      product_name: "Nutella",
      product_name_es: "Crema de avellanas",
      brands: "Ferrero, Nutella",
      quantity: "400 g",
      nutriscore_grade: "e",
      clave_interna_del_tercero: "no-debe-salir",
    },
  });
  assert.equal(p.nombre, "Crema de avellanas");
  assert.deepEqual(p.marcas, ["Ferrero", "Nutella"]);
  assert.equal(p.nutriscore, "E");
  assert.equal("clave_interna_del_tercero" in p, false);
  assert.equal(interpretarProductoOff({ status: 0 }), null);
  assert.equal(interpretarProductoOff(null), null);
});

test("plan de compra: clima, feriado y consejo combinados", () => {
  const clima = interpretarClima({
    current: { temperature_2m: 21.6, weather_code: 61 },
    daily: { precipitation_probability_max: [80] },
  });
  assert.equal(clima.temperatura, 22);
  assert.equal(clima.probLluviaHoy, 80);
  assert.equal(interpretarClima({}), null);

  const feriados = [{ date: "2026-10-21", localName: "Día de prueba", name: "Test day" }];
  const f = feriadoEn(feriados, new Date(2026, 9, 21));
  assert.equal(f.nombre, "Día de prueba");
  assert.equal(feriadoEn(feriados, new Date(2026, 9, 22)), null);

  const texto = textoConsejo({ clima, feriado: f });
  assert.match(texto, /feriado/i);
  assert.match(texto, /lluvia/i);
  assert.equal(textoConsejo({}), "");
  assert.match(textoConsejo({ clima: { temperatura: 35, probLluviaHoy: 0 } }), /refrigerados/);
});

test("bases con respaldo por entorno: la del env va primero y se sanea", () => {
  const bases = basesExternas(
    "https://mx.openfoodfacts.org/",
    "https://world.openfoodfacts.org",
    "https://mx.openfoodfacts.org",
  );
  assert.deepEqual(bases, ["https://mx.openfoodfacts.org", "https://world.openfoodfacts.org"]);
  // Nada de http, credenciales ni query: no debe volverse proxy abierto.
  assert.deepEqual(basesExternas("http://inseguro.test", "https://ok.test"), ["https://ok.test"]);
  assert.deepEqual(basesExternas("https://user:pass@evil.test/?x=1"), []);
  assert.deepEqual(basesExternas("no es url", "https://ok.test/v1/"), ["https://ok.test/v1"]);
  assert.deepEqual(basesExternas("", "https://a.test"), ["https://a.test"]);
});

test("coordenadas seguras para las rutas de servidor", () => {
  assert.equal(coordenadaSegura("19.43", -90, 90), 19.43);
  assert.equal(coordenadaSegura("999", -90, 90), null);
  assert.equal(coordenadaSegura("abc", -90, 90), null);
  assert.equal(coordenadaSegura(null, -180, 180), null);
});

test("índice invertido del catálogo sigue encontrando candidatos", () => {
  const leche = candidatosPorNombre("leche");
  assert.ok(leche.some((p) => p.id === "leche_1l"));
  assert.ok(candidatosPorNombre("jitomate").some((p) => p.id === "jitomate_kg"));
  assert.ok(candidatosPorNombre("").length > 0);
});
