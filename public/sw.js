const CACHE = "despensa-mx-v3";
const PRECACHE = ["/", "/instalar", "/manifest.json", "/privacidad", "/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

/** Solo se guardan respuestas propias y correctas: nada de opacos ni errores. */
function guardable(respuesta, url) {
  return (
    respuesta &&
    respuesta.ok &&
    respuesta.type === "basic" &&
    url.origin === self.location.origin
  );
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Las API van primero a la red; la copia en caché es solo para cuando no haya
  // internet. Se guardan porque no contienen datos personales.
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (guardable(res, url)) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Terceros (tiles de OpenStreetMap): solo red, nunca caché.
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req)
        .then((res) => {
          if (guardable(res, url)) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => hit || caches.match("/"));
      return hit || net;
    })
  );
});
