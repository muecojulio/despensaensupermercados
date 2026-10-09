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
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
];

const MODELOS_GROQ = [
  "meta-llama/llama-4-scout-17b-16e-instruct",
  "llama-3.2-11b-vision-preview",
];

// Tope del cuerpo: 5 MB de base64 (≈3.7 MB de imagen) para no reventar el límite
// de Vercel ni la cuota del proveedor con una sola petición.
const MAX_TEXTO = 5_000_000;
const TIMEOUT_MS = 45_000;
const MAX_POR_MINUTO = 8;

const PROMPT =
  "Extrae la lista de despensa de esta imagen. Responde SOLO un producto por renglón, en español, con cantidad si se ve. Ejemplo:\n2 leche\n1 huevo\n1 Coca-Cola\nSi no hay lista, responde VACIO.";

function limpiaRespuesta(texto) {
  const t = String(texto || "").trim();
  if (!t) return "";
  if (t.toUpperCase() === "VACIO") return "";
  return t;
}

function modelos(env, lista) {
  const forzado = modeloConfigurado(env);
  return forzado ? [forzado] : lista;
}

async function leerConGemini(imagen, apiKey) {
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
          signal: AbortSignal.timeout(TIMEOUT_MS),
          cache: "no-store",
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // El detalle del proveedor se queda en el log del servidor: puede traer
        // fragmentos de la URL o del proyecto y no se devuelve al navegador.
        ultimoError = data?.error?.message || `HTTP ${res.status}`;
        continue;
      }
      const texto = limpiaRespuesta(
        data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("\n"),
      );
      if (texto) return { texto, proveedor: "gemini", modelo };
      ultimoError = "respuesta vacía";
    } catch (err) {
      ultimoError = err?.message || "falló la petición";
    }
  }
  console.error("[lista-foto] gemini sin respuesta:", ultimoError);
  return { error: "Gemini no respondió" };
}

async function leerConGroq(imagen, apiKey) {
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
                // Solo data URLs de imagen validadas: si se aceptara cualquier
                // cadena, un cliente podría hacer que Groq pida URLs externas.
                { type: "image_url", image_url: { url: imagen } },
              ],
            },
          ],
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
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
    } catch (err) {
      ultimoError = err?.message || "falló la petición";
    }
  }
  console.error("[lista-foto] groq sin respuesta:", ultimoError);
  return { error: "Groq no respondió" };
}

export async function POST(request) {
  const ip = ipDelCliente(request);
  const cupo = limiteDeUso(`foto:${ip}`, MAX_POR_MINUTO, 60_000);
  if (!cupo.permitido) {
    return Response.json(
      { error: "Muchas fotos seguidas. Espera un minuto e inténtalo otra vez." },
      { status: 429, headers: cabecerasLimite(cupo, MAX_POR_MINUTO) },
    );
  }

  const tipo = request.headers.get("content-type") || "";
  if (!tipo.toLowerCase().includes("application/json")) {
    return Response.json({ error: "Petición inválida." }, { status: 415 });
  }

  const anunciado = Number(request.headers.get("content-length") || 0);
  if (anunciado > MAX_TEXTO) {
    return Response.json(
      { error: "La foto es muy pesada. Toma otra más cerca." },
      { status: 413 },
    );
  }

  try {
    const crudo = await request.text();
    if (crudo.length > MAX_TEXTO) {
      return Response.json(
        { error: "La foto es muy pesada. Toma otra más cerca." },
        { status: 413 },
      );
    }

    let body;
    try {
      body = JSON.parse(crudo);
    } catch {
      return Response.json({ error: "No llegó la foto." }, { status: 400 });
    }

    const imagen = body?.imagen;
    if (!esImagenDataUrlSegura(imagen)) {
      return Response.json(
        { error: "La foto no es una imagen válida. Tómala otra vez." },
        { status: 400 },
      );
    }

    const gemini = (process.env.GEMINI_API_KEY || "").trim();
    const groq = (process.env.GROQ_API_KEY || "").trim();

    if (!gemini && !groq) {
      return Response.json(
        {
          error:
            "Para leer fotos hay que pegar una key gratis de Gemini o Groq en Vercel (Settings → Environment Variables). Mientras tanto usa .txt o .csv.",
        },
        { status: 501 },
      );
    }

    if (gemini) {
      const r = await leerConGemini(imagen, gemini);
      if (r.texto) {
        return Response.json({
          texto: limpiarTextoModelo(r.texto),
          proveedor: r.proveedor,
          modelo: r.modelo,
        });
      }
      if (!groq) {
        return Response.json(
          { error: "No pude leer la foto con Gemini. Revisa la key o prueba con Groq." },
          { status: 502 },
        );
      }
    }

    const r = await leerConGroq(imagen, groq);
    if (r.texto) {
      return Response.json({
        texto: limpiarTextoModelo(r.texto),
        proveedor: r.proveedor,
        modelo: r.modelo,
      });
    }

    return Response.json(
      {
        error:
          "No pude leer la foto. Prueba con una imagen más clara, con un .txt o con un .csv.",
      },
      { status: 422 },
    );
  } catch (error) {
    console.error("[lista-foto] fallo inesperado:", error?.message || error);
    return Response.json({ error: "Falló la lectura de la foto." }, { status: 500 });
  }
}
