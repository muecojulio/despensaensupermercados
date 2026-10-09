# Política de seguridad

Despensa MX es una app web sin cuentas, sin base de datos de usuarios y sin
servidor propio: las listas viven en el navegador. Aun así hay dos rutas de API
y un service worker, así que esto es lo que se hace y lo que toca revisar.

## Versiones soportadas

Solo se mantiene la última versión de la rama `main`. No hay versiones anteriores
ni LTS.

## Cómo reportar una vulnerabilidad

Abre un issue privado en el repositorio (**Security → Report a vulnerability**) o
escribe al correo del mantenedor. Incluye:

1. Dónde está el problema (ruta, archivo o pantalla).
2. Pasos para reproducirlo (o una prueba de concepto mínima).
3. Qué impacto tendría.

Se confirma la recepción en un plazo razonable y se avisa antes de publicar
cualquier detalle en abierto. No hace falta abrir issue público: se prefiere el
reporte privado para no exponer a los usuarios mientras se corrige.

## Medidas implementadas

### Cabeceras (middleware.js, next.config.mjs, vercel.json)

- **Content-Security-Policy** con nonce por petición y `strict-dynamic`. Ni
  `unsafe-inline` para scripts ni hosts de CDN dados de alta. React escribe
  atributos `style` en el HTML del servidor, así que `style-src` sí acepta
  `unsafe-inline`; es lo único que queda abierto ahí.
- **HSTS** (`max-age=63072000; includeSubDomains; preload`) solo en producción.
- **X-Content-Type-Options: nosniff**, **Referrer-Policy**,
  **Permissions-Policy** (sin micrófono ni pagos), **X-Frame-Options: DENY** y
  `frame-ancestors 'none'` en producción.
- **Cross-Origin-Opener-Policy: same-origin** y **X-DNS-Prefetch-Control: off**.

### Superficie de servidor (`app/api`)

- `/api/lista-foto` acepta **solo** data URLs de imagen (`image/jpeg`,
  `image/png`, `image/webp`) con base64 válido. Antes se reenviaba la cadena tal
  cual al proveedor: una petición hecha a mano podía hacer que Groq pidiera una
  URL arbitraria (SSRF de rebote).
- Tope de cuerpo: 5 MB de base64 (~3.7 MB de imagen) y `content-length`
  verificado antes de leer.
- Límite de uso por IP (8 fotos/minuto, 60 consultas/minuto en `/api/marcas`) con
  cabeceras `RateLimit-*` y `Retry-After`. Es en memoria, así que en serverless
  se aplica por instancia: mitigación, no garantía.
- `AbortSignal.timeout` en todas las llamadas a terceros (45 s lectura de foto,
  8 s Open Food Facts).
- Los errores del proveedor se registran en el log del servidor y **no** se
  devuelven al navegador: pueden traer identificadores del proyecto o de la key.
- La salida del modelo pasa por `limpiarTextoModelo()` (sin caracteres de
  control, máximo 200 renglones) antes de llegar al cliente.
- Las variables `GEMINI_MODEL` / `GROQ_MODEL` se validan contra
  `^[A-Za-z0-9._\-/]{1,64}$` antes de usarse en la URL del proveedor.

### Cliente

- Leaflet 1.9.4 se sirve desde `/vendor/leaflet` (mismo origen) en lugar de
  unpkg: nada de código de terceros en tiempo de ejecución.
- Todos los enlaces y ventanas nuevas llevan `noopener`.
- Sin `dangerouslySetInnerHTML`: los nombres que vienen de Open Food Facts, de
  Overpass o de la foto se insertan como texto.
- Las claves opcionales (Gemini/Groq) viven en variables de entorno de Vercel,
  nunca en el código ni en el paquete del cliente.

## Fuera del alcance

- No hay autenticación ni sesiones: no hay tokens ni contraseñas que proteger.
- Los datos se guardan en `localStorage` e `IndexedDB` del navegador. Si el
  dispositivo está comprometido, esos datos también. No se cifran porque la app
  no maneja datos sensibles.
