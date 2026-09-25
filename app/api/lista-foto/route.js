export async function POST(request) {
  try {
    const body = await request.json();
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

    const gemini = process.env.GEMINI_API_KEY;
    const groq = process.env.GROQ_API_KEY;
    const prompt =
      "Extrae la lista de despensa de esta imagen. Responde SOLO un producto por renglón, en español, con cantidad si se ve. Ejemplo:\n2 leche\n1 huevo\n1 Coca-Cola\nSi no hay lista, responde VACIO.";

    if (gemini) {
      const raw = imagen.replace(/^data:[^;]+;base64,/, "");
      const mime = (imagen.match(/^data:([^;]+);base64,/) || [])[1] || "image/jpeg";
      const res = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=" +
          encodeURIComponent(gemini),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  { inline_data: { mime_type: mime, data: raw } },
                ],
              },
            ],
          }),
        }
      );
      const data = await res.json();
      const texto = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("\n") || "";
      if (!texto || texto.trim().toUpperCase() === "VACIO") {
        return Response.json({ error: "No vi una lista en esa foto." }, { status: 422 });
      }
      return Response.json({ texto: texto.trim() });
    }

    if (groq) {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + groq,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: imagen } },
              ],
            },
          ],
        }),
      });
      const data = await res.json();
      const texto = data?.choices?.[0]?.message?.content || "";
      if (!texto || texto.trim().toUpperCase() === "VACIO") {
        return Response.json(
          { error: "No pude leer la foto con Groq. Prueba Gemini o un .txt." },
          { status: 422 }
        );
      }
      return Response.json({ texto: texto.trim() });
    }

    return Response.json(
      {
        error:
          "Para leer fotos hay que pegar una key gratis de Gemini o Groq en Vercel. Mientras tanto usa .txt, .csv o Excel.",
      },
      { status: 501 }
    );
  } catch {
    return Response.json({ error: "Falló la lectura de la foto." }, { status: 500 });
  }
}
