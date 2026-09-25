export const dynamic = "force-dynamic";

function limpia(s) {
  return String(s || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 48);
}

export async function GET(request) {
  const q = limpia(new URL(request.url).searchParams.get("q"));
  if (q.length < 2) {
    return Response.json({ marcas: [] });
  }

  const url =
    "https://world.openfoodfacts.org/cgi/search.pl?search_terms=" +
    encodeURIComponent(q) +
    "&search_simple=1&action=process&json=1&page_size=20&cc=mx&lc=es";

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "DespensaMX/1.0 (comparador de despensa; +https://openfoodfacts.org)",
        Accept: "application/json",
      },
      next: { revalidate: 43200 },
    });
    if (!res.ok) {
      return Response.json({ marcas: [], fuente: "openfoodfacts", error: "upstream" }, { status: 200 });
    }
    const data = await res.json();
    const seen = new Set();
    const marcas = [];
    for (const p of data.products || []) {
      const brand = limpia((p.brands || "").split(",")[0]);
      if (!brand) continue;
      const key = brand.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      marcas.push(brand);
      if (marcas.length >= 12) break;
    }
    return Response.json(
      { marcas, fuente: "openfoodfacts" },
      {
        headers: {
          "Cache-Control": "public, s-maxage=43200, stale-while-revalidate=86400",
        },
      }
    );
  } catch {
    return Response.json({ marcas: [] }, { status: 200 });
  }
}
