import test from "node:test";
import assert from "node:assert/strict";
import {
  esImagenDataUrlSegura,
  ipDelCliente,
  limpiarTextoModelo,
  limiteDeUso,
  modeloConfigurado,
} from "../lib/seguridad.js";

const dataUrl = (mime, bytes) => `data:${mime};base64,${Buffer.from(bytes).toString("base64")}`;

const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jJ0YAAAAASUVORK5CYII=",
  "base64",
);

test("acepta firmas de imagen admitidas y rechaza tipos o firmas falsas", () => {
  const jpeg = dataUrl("image/jpeg", [0xff, 0xd8, 0xff, 0xd9]);
  const png = dataUrl("image/png", PNG_1PX);
  const webp = dataUrl("image/webp", [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);

  assert.equal(esImagenDataUrlSegura(jpeg), true);
  assert.equal(esImagenDataUrlSegura(png), true);
  assert.equal(esImagenDataUrlSegura(webp), true);
  assert.equal(esImagenDataUrlSegura("https://example.test/image.png"), false);
  assert.equal(esImagenDataUrlSegura("data:image/svg+xml;base64,PHN2Zz4="), false);
  assert.equal(esImagenDataUrlSegura(dataUrl("image/png", "<script>alert(1)</script>")), false);
  assert.equal(esImagenDataUrlSegura("data:image/png;base64,AAAA="), false);
});

test("valida los nombres de modelo antes de construir una URL", () => {
  assert.equal(modeloConfigurado("qwen/qwen3.8-27b"), "qwen/qwen3.8-27b");
  assert.equal(modeloConfigurado("gemini-3-flash-preview"), "gemini-3-flash-preview");
  assert.equal(modeloConfigurado("../../admin?x=1"), "");
  assert.equal(modeloConfigurado("x".repeat(65)), "");
});

test("limpia controles y limita los renglones que devuelve el modelo", () => {
  const texto = limpiarTextoModelo("leche\u0000\r\nhuevo\n" + "x".repeat(150));
  const lineas = texto.split("\n");
  assert.equal(lineas[0], "leche");
  assert.equal(lineas[1], "huevo");
  assert.equal(lineas[2].length, 120);
  assert.ok(lineas.length <= 200);
  assert.ok(texto.length <= 4000);
});

test("usa la IP del proxy de confianza y limita peticiones por ventana", () => {
  const request = new Request("https://despensa.example/api/lista-foto", {
    headers: { "x-forwarded-for": "203.0.113.10, 198.51.100.7" },
  });
  assert.equal(ipDelCliente(request), "198.51.100.7");

  const key = `security-test:${crypto.randomUUID()}`;
  assert.equal(limiteDeUso(key, 1, 60_000).permitido, true);
  const bloqueada = limiteDeUso(key, 1, 60_000);
  assert.equal(bloqueada.permitido, false);
  assert.equal(bloqueada.restante, 0);
  assert.ok(bloqueada.reintentaSeg > 0);
});
