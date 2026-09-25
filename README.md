# Despensa MX

Compara una lista de despensa entre súpers del Valle de México y dime en cuál tienda sale más barato comprar **todo junto**.

## Importante

Esta app **no** lee precios en vivo de Walmart, Soriana o Chedraui. Usa un catálogo de referencia para CDMX y zona conurbada. Confirma en la tienda.

## Qué incluye

- Subir .txt, .csv o Excel; foto de la lista (opcional, con key de Gemini/Groq)
- Producto + marca (catálogo local y Open Food Facts)
- Una sola barra de pestañas (abajo): Subir, Resultado, Lista, Cerca, Más
- Catálogo en Lista y en Más
- Ranking, ahorro, ticket, antojos aparte del presupuesto
- Mapa con geolocalización (OpenStreetMap + Overpass, con caché)
- Caché en service worker e IndexedDB (índices tipo y expira)
- Política de privacidad en /privacidad
- Archivos de ejemplo en /ejemplo-despensa.txt y /ejemplo-despensa.csv

## APIs

Con key (opcionales, no se quitan):

- GEMINI_API_KEY o GROQ_API_KEY para lectura de foto de la lista

Sin key ni registro:

- Open Food Facts (github.com/openfoodfacts/openfoodfacts-server) — marcas
- Overpass / OSM — súpers cerca
- Leaflet (github.com/Leaflet/Leaflet) — mapa
- QR Server — código para instalar

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
3. No subas node_modules ni .env
4. Abre la URL en el celular → Agregar a pantalla de inicio
