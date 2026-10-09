import { NextResponse } from "next/server";

/**
 * Cabeceras de seguridad y CSP con nonce por petición.
 *
 * Next copia el nonce de la cabecera Content-Security-Policy de la petición a
 * los <script> que inyecta (server/app-render/get-script-nonce-from-header.js),
 * así que la política se calcula aquí, se reenvía en los headers de la petición
 * y se devuelve también en la respuesta.
 *
 * Con `strict-dynamic` basta el nonce: los scripts que crea un script ya
 * permitido (así carga Leaflet el mapa) siguen valiendo sin abrir hosts sueltos.
 */
const ES_PRODUCCION = process.env.NODE_ENV === "production";

function nonceSeguro() {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  let binario = "";
  for (const byte of bytes) binario += String.fromCharCode(byte);
  return typeof btoa === "function"
    ? btoa(binario)
    : Buffer.from(bytes).toString("base64");
}

function politicaContenido(nonce) {
  const directivas = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-src 'none'",
    // React escribe atributos style en el HTML del servidor: sin 'unsafe-inline'
    // se pierden los colores por pasillo, las barras y el indicador de pestañas.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://tile.openstreetmap.org https://*.tile.openstreetmap.org",
    "font-src 'self' data:",
    "form-action 'self'",
    "manifest-src 'self'",
    "worker-src 'self'",
  ];

  if (ES_PRODUCCION) {
    directivas.push(`script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`);
    directivas.push(
      "connect-src 'self' https://overpass-api.de https://overpass.kumi.systems",
    );
    directivas.push("frame-ancestors 'none'");
    directivas.push("upgrade-insecure-requests");
  } else {
    // En desarrollo Next usa eval para el HMR y abre un websocket al compiler.
    // Tampoco se bloquea el embed para poder ver la app en vistas previas.
    directivas.push(`script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval'`);
    directivas.push(
      "connect-src 'self' ws: wss: https://overpass-api.de https://overpass.kumi.systems",
    );
    directivas.push("frame-ancestors *");
  }

  return directivas.join("; ");
}

export function middleware(request) {
  const nonce = nonceSeguro();
  const csp = politicaContenido(nonce);
  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", csp);

  const respuesta = NextResponse.next({ request: { headers } });
  respuesta.headers.set("Content-Security-Policy", csp);
  respuesta.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  respuesta.headers.set("X-Permitted-Cross-Domain-Policies", "none");
  respuesta.headers.set("X-DNS-Prefetch-Control", "off");

  if (ES_PRODUCCION) {
    respuesta.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
    // vercel.json ya la manda en Vercel; aquí queda también para otro hosting.
    respuesta.headers.set("X-Frame-Options", "DENY");
  }

  return respuesta;
}

export const config = {
  // Documentos, RSC y APIs. Los estáticos (/_next, /vendor, iconos) quedan
  // fuera: no necesitan política por petición y así no gastamos invocaciones.
  matcher: [
    "/((?!_next/static|_next/image|vendor/|icon-|favicon.ico|robots.txt).*)",
  ],
};
