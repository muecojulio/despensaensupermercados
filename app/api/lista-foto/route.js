export const runtime = "nodejs";

import {
  cabecerasLimite,
  esImagenDataUrlSegura,
  ipDelCliente,
  limpiarTextoModelo,
  limiteDeUso,
  mimeDeDataUrl,
  modeloConfigurado,
} from "../../../lib/seguridad";

const MODELOS_GEMINI = [
  "gemini-3.5-flash",
  "gemini-3.8-flash",
  "gemini-3-flash-preview",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash",
];

const MODELOS_GROQ = [
  "qwen/qwen3.8-27b",
  "qwen/qwen3.6-27b",
  "meta-llama/llama-4-scout-17b-16e-instruct",
];

// 5 MB de texto base64 son como máximo ~3.75 MB de imagen binaria.
const MAX_TEXTO = 5_000_000;
const TIMEOUT_MODELO_MS = 10_000;
const TIEMPO_TOTAL_MS = 26_000;
const MAX_POR_MINUTO = 8;

const PROMPT =
  "Extrae la lista de despensa de esta imagen. Responde SOLO un producto por renglón, en español, con cantidad si se ve. Ejemplo:\n2 leche\n1 huevo\n1 Coca-Cola\nSi no hay lista, responde VACIO.";

function jsonSinCache(datos, opciones = {}) {
  return Response.json(datos, {
    ...opciones,
    headers: { "Cache-Control": "no-store", ...opciones.headers },
  });
}

function origenPermitido(request) {
  const origin = request.headers.get("origin");
  if (!origin) return true; // clientes no-browser y herramientas locales
  try {
    // Next puede construir request.url con el bind address (p. ej. 0.0.0.0)
    // en vez del host público; compara con los headers de proxy que ya usa la
    // plataforma para dirigir esta misma petición.
    const host = (
      request.headers.get("x-forwarded-host") ||
      request.headers.get("host") ||
      new URL(request.url).host
    ).split(",")[0].trim();
    const proto = (
      request.headers.get("x-forwarded-proto") ||
      new URL(request.url).protocol.replace(/:$/, "")
    ).split(",")[0].trim();
    return new URL(origin).origin === new URL(`${proto}://${host}`).origin;
  } catch {
    return false;
  }
}

/** Lee el stream con tope real: no confiamos solo en Content-Length. */
async function leerCuerpoLimitado(request, limite) {
  if (!request.body) return { texto: "", excedido: false };
  const reader = request.body.getReader();
  const fragmentos = [];
  let longitud = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      longitud += value.byteLength;
      if (longitud > limite) {
        await reader.cancel().catch(() => {});
        return { texto: "", excedido: true };
      }
      fragmentos.push(value);
    }
  } finally {
    try { reader.releaseLock(); } catch { /* stream ya cerrado */ }
  }

  const bytes = new Uint8Array(longitud);
  let offset = 0;
  for (const parte of fragmentos) {
    bytes.set(parte, offset);
    offset += parte.byteLength;
  }
  return { texto: new TextDecoder().decode(bytes), excedido: false };
}

function limpiaRespuesta(texto) {
  const t = String(texto || "").trim();
  if (!t || t.toUpperCase() === "VACIO") return "";
  return t;
}

function modelos(env, lista) {
  const forzado = modeloConfigurado(env);
  return forzado ? [forzado] : lista;
}

function senalModelo(senalTotal) {
  return AbortSignal.any([senalTotal, AbortSignal.timeout(TIMEOUT_MODELO_MS)]);
}

async function leerConGemini(imagen, apiKey, senalTotal) {
  const raw = imagen.slice(imagen.indexOf(",") + 1);
  const mime = mimeDeDataUrl(imagen);
  let ultimoError = "";

  for (const modelo of modelos(process.env.GEMINI_MODEL, MODELOS_GEMINI)) {
    try {
      const res = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/" +
          encodeURIComponent(modelo) +
          ":generateContent",
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: PROMPT }, { inline_data: { mime_type: mime, data: raw } }],
              },
            ],
          }),
          signal: senalModelo(senalTotal),
          cache: "no-store",
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        ultimoError = data?.error?.message || `HTTP ${res.status}`;
        continue;
      }
      const texto = limpiaRespuesta(
        data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("\n"),
      );
      if (texto) return { texto, proveedor: "gemini", modelo };
      ultimoError = "respuesta vacía";
    } catch (error) {
      ultimoError = error?.message || "falló la petición";
    }
  }
  console.error("[lista-foto] gemini sin respuesta:", ultimoError);
  return { error: "Gemini no respondió" };
}

async function leerConGroq(imagen, apiKey, senalTotal) {
  let ultimoError = "";

  for (const modelo of modelos(process.env.GROQ_MODEL, MODELOS_GROQ)) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: modelo,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: PROMPT },
                // Solo data URLs validadas: si se aceptara cualquier cadena, un
                // cliente podría hacer que Groq pidiera una URL arbitraria.
                { type: "image_url", image_url: { url: imagen } },
              ],
            },
          ],
        }),
        signal: senalModelo(senalTotal),
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        ultimoError = data?.error?.message || `HTTP ${res.status}`;
        continue;
      }
      const texto = limpiaRespuesta(data?.choices?.[0]?.message?.content);
      if (texto) return { texto, proveedor: "groq", modelo };
      ultimoError = "respuesta vacía";
    } catch (error) {
      ultimoError = error?.message || "falló la petición";
    }
  }
  console.error("[lista-foto] groq sin respuesta:", ultimoError);
  return { error: "Groq no respondió" };
}

export async function POST(request) {
  // Rechaza peticiones cross-site con Origin falsificado; no hay autenticación,
  // pero un sitio ajeno no debería poder consumir las llaves de IA del dueño.
  if (!origenPermitido(request)) {
    return jsonSinCache({ error: "Origen no permitido." }, { status: 403 });
  }

  const ip = ipDelCliente(request);
  const cupo = limiteDeUso(`foto:${ip}`, MAX_POR_MINUTO, 60_000);
  if (!cupo.permitido) {
    return jsonSinCache(
      { error: "Muchas fotos seguidas. Espera un minuto e inténtalo otra vez." },
      { status: 429, headers: cabecerasLimite(cupo, MAX_POR_MINUTO) },
    );
  }

  const tipo = request.headers.get("content-type") || "";
  if (!tipo.toLowerCase().includes("application/json")) {
    return jsonSinCache({ error: "Petición inválida." }, { status: 415 });
  }

  const anunciado = Number(request.headers.get("content-length") || 0);
  if (anunciado > MAX_TEXTO) {
    return jsonSinCache(
      { error: "La foto es muy pesada. Toma otra más cerca." },
      { status: 413 },
    );
  }

  try {
    const { texto: crudo, excedido } = await leerCuerpoLimitado(request, MAX_TEXTO);
    if (excedido) {
      return jsonSinCache(
        { error: "La foto es muy pesada. Toma otra más cerca." },
        { status: 413 },
      );
    }

    let body;
    try {
      body = JSON.parse(crudo);
    } catch {
      return jsonSinCache({ error: "No llegó la foto." }, { status: 400 });
    }

    const imagen = body?.imagen;
    if (!esImagenDataUrlSegura(imagen)) {
      return jsonSinCache(
        { error: "La foto no es una imagen válida. Tómala otra vez." },
        { status: 400 },
      );
    }

    const gemini = (process.env.GEMINI_API_KEY || "").trim();
    const groq = (process.env.GROQ_API_KEY || "").trim();

    if (!gemini && !groq) {
      return jsonSinCache(
        {
          error:
            "Para leer fotos hay que pegar una key gratis de Gemini o Groq en Vercel (Settings → Environment Variables). Mientras tanto usa .txt o .csv.",
        },
        { status: 501 },
      );
    }

    const controlador = new AbortController();
    const reloj = setTimeout(() => controlador.abort(), TIEMPO_TOTAL_MS);
    try {
      if (gemini) {
        const r = await leerConGemini(imagen, gemini, controlador.signal);
        if (r.texto) {
          return jsonSinCache({
            texto: limpiarTextoModelo(r.texto),
            proveedor: r.proveedor,
            modelo: r.modelo,
          });
        }
        if (!groq) {
          return jsonSinCache(
            { error: "No pude leer la foto con Gemini. Revisa la key o prueba con Groq." },
            { status: 502 },
          );
        }
      }

      const r = await leerConGroq(imagen, groq, controlador.signal);
      if (r.texto) {
        return jsonSinCache({
          texto: limpiarTextoModelo(r.texto),
          proveedor: r.proveedor,
          modelo: r.modelo,
        });
      }
      return jsonSinCache(
        {
          error:
            "No pude leer la foto. Prueba con una imagen más clara, con un .txt o con un .csv.",
        },
        { status: 422 },
      );
    } finally {
      clearTimeout(reloj);
    }
  } catch (error) {
    console.error("[lista-foto] fallo inesperado:", error?.message || error);
    return jsonSinCache({ error: "Falló la lectura de la foto." }, { status: 500 });
  }
}
