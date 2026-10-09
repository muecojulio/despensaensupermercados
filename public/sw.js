const CACHE = "despensa-mx-v4";
const PRECACHE = ["/", "/instalar", "/manifest.json", "/privacidad", "/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

/** Solo se guarda contenido propio y correcto: nada de opaque responses. */
function guardable(respuesta, url) {
  return (
    respuesta &&
    respuesta.ok &&
    respuesta.type === "basic" &&
    url.origin === self.location.origin
  );
}

async function guardarEnCache(request, response, url) {
  if (!guardable(response, url)) return;
  try {
    const cache = await caches.open(CACHE);
    await cache.put(request, response.clone());
  } catch {
    // Si el dispositivo está sin cuota, la petición de red sigue funcionando.
  }
}

function nonceNuevo() {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  let binario = "";
  for (const byte of bytes) binario += String.fromCharCode(byte);
  return btoa(binario);
}

/**
 * El HTML dinámico se cachea para modo offline, pero no se reutiliza su nonce:
 * en cada fallback offline se emite un CSP y nonce nuevos, sincronizados con
 * los <script nonce> del documento. En línea siempre se prefiere red.
 */
async function respuestaOfflineConNonce(cacheada) {
  const csp = cacheada.headers.get("content-security-policy");
  const nonceAnterior = csp?.match(/'nonce-([A-Za-z0-9+/]+={0,2})'/)?.[1];
  if (!nonceAnterior) return cacheada;

  const nonce = nonceNuevo();
  const html = (await cacheada.text())
    .replaceAll(`nonce="${nonceAnterior}"`, `nonce="${nonce}"`)
    .replaceAll(`nonce='${nonceAnterior}'`, `nonce='${nonce}'`);
  const headers = new Headers(cacheada.headers);
  headers.set("content-security-policy", csp.replaceAll(`'nonce-${nonceAnterior}'`, `'nonce-${nonce}'`));
  headers.set("x-nonce", nonce);
  headers.delete("content-length");
  headers.delete("content-encoding");
  headers.delete("etag");
  return new Response(html, { status: cacheada.status, statusText: cacheada.statusText, headers });
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // No se persisten consultas, respuestas RSC ni API en CacheStorage. La caché
  // de marcas/ubicaciones vive en IndexedDB con una expiración controlada.
  if (
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api/") ||
    url.searchParams.has("_rsc") ||
    req.headers.has("rsc") ||
    req.headers.has("next-router-prefetch")
  ) return;

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then(async (res) => {
          await guardarEnCache(req, res, url);
          return res;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE);
          const hit = (await cache.match(req)) || (await cache.match("/"));
          return hit ? respuestaOfflineConNonce(hit) : Response.error();
        })
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req)
        .then(async (res) => {
          await guardarEnCache(req, res, url);
          return res;
        })
        .catch(() => hit || caches.match("/"));
      return hit || net;
    })
  );
});
