/**
 * Cabeceras de seguridad base (para cualquier hosting que no sea Vercel).
 *
 * En Vercel manda vercel.json, que además cubre los estáticos (/_next, iconos).
 * El resto —CSP con nonce, HSTS y COOP— lo pone middleware.js, porque necesita
 * calcular un nonce por petición.
 *
 * X-Frame-Options: DENY vive en vercel.json y en middleware (solo producción),
 * para que las vistas previas locales se puedan mostrar dentro de un iframe.
 *
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "geolocation=(self), camera=(self), microphone=(), payment=(), usb=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
