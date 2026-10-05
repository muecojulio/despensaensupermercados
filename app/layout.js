import "./globals.css";

export const metadata = {
  title: "Despensa MX",
  description:
    "Compara tu lista de despensa entre súpers del Valle de México e instala la app en el celular.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Despensa MX",
    statusBarStyle: "black-translucent",
  },
};

export const viewport = {
  themeColor: "#12352a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Despensa MX" />
        <link rel="apple-touch-icon" href="/icon-192.svg" />
        <link rel="icon" href="/icon-192.svg" type="image/svg+xml" />
      </head>
      <body>{children}</body>
    </html>
  );
}
