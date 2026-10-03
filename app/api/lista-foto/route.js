export const runtime = "nodejs";

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

const PROMPT =
  "Extrae la lista de despensa de esta imagen. Responde SOLO un producto por renglón, en español, con cantidad si se ve. Ejemplo:\n2 leche\n1 huevo\n1 Coca-Cola\nSi no hay lista, responde VACIO.";

function limpiaRespuesta(texto) {
  const t = String(texto || "").trim();
  if (!t) return "";
  if (t.toUpperCase() === "VACIO") return "";
  return t;
}

function modelos(env, lista) {
  const forzado = (env || "").trim();
  return forzado ? [forzado] : lista;
}

async function leerConGemini(imagen, apiKey) {
  const raw = imagen.replace(/^data:[^;]+;base64,/, "");
  const mime = (imagen.match(/^data:([^;]+);base64,/) || [])[1] || "image/jpeg";
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
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        ultimoError = data?.error?.message || "HTTP " + res.status;
        continue;
      }
      const texto = limpiaRespuesta(
        data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("\n")
      );
      if (texto) return { texto, proveedor: "gemini", modelo };
      ultimoError = "respuesta vacía";
    } catch (err) {
      ultimoError = err?.message || "falló la petición";
    }
  }
  return { error: ultimoError || "Gemini no respondió" };
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
                { type: "image_url", image_url: { url: imagen } },
              ],
            },
          ],
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        ultimoError = data?.error?.message || "HTTP " + res.status;
        continue;
      }
      const texto = limpiaRespuesta(data?.choices?.[0]?.message?.content);
      if (texto) return { texto, proveedor: "groq", modelo };
      ultimoError = "respuesta vacía";
    } catch (err) {
      ultimoError = err?.message || "falló la petición";
    }
  }
  return { error: ultimoError || "Groq no respondió" };
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const imagen = body?.imagen;
    if (!imagen || typeof imagen !== "string") {
      return Response.json({ error: "No llegó la foto." }, { status: 400 });
    }
    if (imagen.length > 3500000) {
      return Response.json(
        { error: "La foto es muy pesada. Toma otra más cerca o baja la resolución." },
        { status: 413 }
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
        { status: 501 }
      );
    }

    if (gemini) {
      const r = await leerConGemini(imagen, gemini);
      if (r.texto) return Response.json({ texto: r.texto, proveedor: r.proveedor, modelo: r.modelo });
      if (!groq) {
        return Response.json(
          { error: "No pude leer la foto con Gemini. Revisa la key o prueba con Groq." },
          { status: 502 }
        );
      }
    }

    const r = await leerConGroq(imagen, groq);
    if (r.texto) return Response.json({ texto: r.texto, proveedor: r.proveedor, modelo: r.modelo });

    return Response.json(
      {
        error:
          "No pude leer la foto. Prueba con una imagen más clara, con un .txt o con un .csv.",
      },
      { status: 422 }
    );
  } catch {
    return Response.json({ error: "Falló la lectura de la foto." }, { status: 500 });
  }
}
