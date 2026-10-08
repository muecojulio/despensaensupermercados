# Despensa MX

Compara una lista de despensa entre súpers del Valle de México y dime en cuál tienda sale más barato comprar **todo junto**.

## Importante

Esta app **no** lee precios en vivo de Walmart, Soriana o Chedraui. Usa un catálogo de referencia para CDMX y zona conurbada. Confirma en la tienda.

## Qué incluye

- Subir .txt o .csv (en Excel: Archivo → Guardar como → CSV); foto de la lista (opcional, con key de Gemini/Groq)
- Producto + marca (catálogo local y Open Food Facts)
- Una sola barra de pestañas (abajo): Subir, Resultado, Lista, Cerca, Más, QR
- Catálogo en Lista y en Más
- Pestaña QR: muestra el código de la app, lo descarga en PNG, copia o comparte
  el enlace y explica cómo instalarla (se dibuja en el celular con lib/qr.js)
- Ranking, ahorro, ticket, antojos aparte del presupuesto
- Mapa con geolocalización (OpenStreetMap + Overpass, con caché)
- Caché en service worker e IndexedDB (índices tipo y expira)
- Política de privacidad en /privacidad
- Archivos de ejemplo en /ejemplo-despensa.txt y /ejemplo-despensa.csv

## APIs

Con key (opcionales, no se quitan):

- GEMINI_API_KEY o GROQ_API_KEY para lectura de foto de la lista.
  La ruta `/api/lista-foto` prueba varios modelos vigentes en orden y acepta
  `GEMINI_MODEL` o `GROQ_MODEL` para fijar uno a mano. La foto se reduce en el
  celular antes de subirla (Vercel corta los envíos arriba de ~4.5 MB).

Sin key ni registro:

- Open Food Facts (github.com/openfoodfacts/openfoodfacts-server) — marcas
- Overpass / OSM — súpers cerca
- Leaflet (github.com/Leaflet/Leaflet) — mapa

El código QR ya no se pide a ningún servicio: se genera en el propio dispositivo
(lib/qr.js, sin dependencias), así que también sale sin internet.

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
npm run build
```

