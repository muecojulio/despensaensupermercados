/**
 * Cabeceras de seguridad.
 *
 * X-Frame-Options: DENY vive en vercel.json (solo producción), para que las
 * vistas previas locales se puedan mostrar dentro de un iframe de desarrollo.
 * En Vercel la app sí queda protegida contra clickjacking.
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
        ],
      },
    ];
  },
};

export default nextConfig;
