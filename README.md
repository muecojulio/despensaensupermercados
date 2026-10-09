# Despensa MX

Compara una lista de despensa entre súpers del Valle de México y dime en cuál tienda sale más barato comprar **todo junto**.

## Importante

Esta app **no** lee precios en vivo de Walmart, Soriana o Chedraui. Usa un catálogo de referencia para CDMX y zona conurbada. Confirma en la tienda.

## Qué incluye

- Subir .txt o .csv (en Excel: Archivo → Guardar como → CSV); foto de la lista (opcional, con key de Gemini/Groq)
- Producto + marca (catálogo local y Open Food Facts)
- Una sola barra de pestañas (abajo): Inicio, Subir, Resultado, Lista, Cerca, Más, QR
  (las opciones de arranque —archivo, foto, catálogo, ejemplo— viven en la
  pestaña Inicio, ya no hay botón de inicio en el encabezado)
- Se instala como app en celular, iPad y computadora (sin tiendas de apps)
- Catálogo en Lista y en Más
- Pestaña QR pensada para **instalar** la app: el código apunta a /instalar, se
  descarga en PNG, se copia o se comparte, y da los pasos según el dispositivo
  (iPad y iPhone con Safari, Android con Chrome, computadora con Chrome/Edge/Safari)
- Página /instalar: detecta el dispositivo, ofrece el botón de instalación cuando el
  navegador lo permite y muestra el QR para pasarla a otro equipo
- Iconos PNG (180/192/512 y maskable) para que se pueda instalar en iPad y Android
- Ranking, ahorro, ticket, antojos aparte del presupuesto
- Mapa con geolocalización (OpenStreetMap + Overpass, con caché)
- Caché de archivos de la app en el service worker; resultados de marcas y mapa
  en IndexedDB con expiración (12 h y 15 min, respectivamente)
- Fondo animado, tema claro/oscuro, mosaico de accesos y resultado con contador,
  podio y confeti (respeta `prefers-reduced-motion`)
- Política de privacidad en /privacidad (actualizada el 9 de octubre de 2026)
- Controles de seguridad, canal privado de reporte y revisiones continuas en
  [SECURITY.md](./SECURITY.md) (`npm audit` + pruebas de seguridad)
- Archivos de ejemplo en /ejemplo-despensa.txt y /ejemplo-despensa.csv

## APIs

Con key (opcionales, no se quitan):

- GEMINI_API_KEY o GROQ_API_KEY para lectura de foto de la lista.
  La ruta `/api/lista-foto` prueba varios modelos vigentes en orden y acepta
  `GEMINI_MODEL` o `GROQ_MODEL` para fijar uno a mano. La foto se reduce en el
  celular antes de subirla; la ruta comprueba origen, tipo y firma del archivo,
  limita el cuerpo a 5 MB, aplica 8 envíos/minuto y un máximo de 26 s por lectura.
- `/api/marcas` consulta Open Food Facts; limita 60 peticiones/minuto y corta
  la llamada externa a los 8 s. Los límites por IP son de mejor esfuerzo por
  instancia serverless (no sustituyen un WAF/Redis).

Sin key ni registro:

- Open Food Facts (github.com/openfoodfacts/openfoodfacts-server) — marcas
- Overpass / OSM — súpers cerca
- Leaflet 1.9.4 (BSD-2-Clause, ver `public/vendor/leaflet/LICENSE`) — se sirve
  desde la propia app, no desde un CDN. Los mosaicos del mapa vienen de OSM.

El código QR ya no se pide a ningún servicio: se genera en el propio dispositivo
(lib/qr.js, sin dependencias), así que también sale sin internet. El service worker
sirve HTML desde red en línea y renueva la CSP/nonce al abrir una copia offline.

## Índices

No hay Postgres ni SQLite en el servidor: las listas viven en el celular. Sí hay:

- Índice invertido en memoria sobre el catálogo (lib/indices.js)
- IndexedDB despensa-mx-cache con almacén entradas e índices tipo y expira

Un índice SQL de servidor no aporta aquí.

## Keys (opcionales)

No hacen falta para comparar precios.

Solo si quieres leer fotos:

- GEMINI_API_KEY o GROQ_API_KEY en Vercel → Settings → Environment Variables

## Publicar en Vercel

1. Repo privado despensaensupermercados
2. Vercel → Import → Framework Next.js → Root Directory .
3. Node.js 24 (`package.json → engines.node = 24.x`). Node 20 ya no está
   disponible en Vercel desde el 1 de octubre de 2026: con 20.x el deploy falla.
4. No subas node_modules ni .env (van en .gitignore). Sí sube package-lock.json.
5. Keys opcionales: Vercel → Settings → Environment Variables → GEMINI_API_KEY
   o GROQ_API_KEY (opcional: GEMINI_MODEL / GROQ_MODEL). Sin keys, la app
   funciona con .txt y .csv.
6. Comandos que usa Vercel: `npm install` → `npm run build` → `next start`.
7. Abre la URL en el celular → Agregar a pantalla de inicio

Antes de subir, comprueba en local:

```bash
npm ci
npm run test:security
npm audit
npm run build
```

