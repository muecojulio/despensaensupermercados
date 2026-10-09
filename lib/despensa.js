import { PRODUCTOS } from "../data/catalogo";
import { candidatosPorNombre } from "./indices";

const PALABRAS_NUMERO = {
  un: 1, una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5,
  seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12,
};

const ENCABEZADOS = [
  "producto", "productos", "articulo", "artículo", "articulos", "nombre",
  "item", "despensa", "cantidad", "cant", "qty", "piezas", "pzas",
];

export function normalizar(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function aNumero(valor) {
  if (valor == null) return null;
  const limpio = String(valor).trim().toLowerCase().replace(",", ".");
  if (PALABRAS_NUMERO[limpio] != null) return PALABRAS_NUMERO[limpio];
  if (!/^\d+(\.\d+)?$/.test(limpio)) return null;
  const n = Number(limpio);
  return n > 0 ? n : null;
}

function esEncabezado(linea) {
  const n = normalizar(linea);
  if (!n) return false;
  const partes = n.split(/[,\t;]/).map((p) => p.trim());
  if (partes.length >= 2 && partes.every((p) => ENCABEZADOS.includes(p))) return true;
  return ENCABEZADOS.includes(n);
}

export function extraerCantidadYNombre(lineaCruda) {
  const linea = String(lineaCruda || "").trim();
  if (!linea) return { cantidad: 1, nombre: "" };
  const partes = linea.split(/[,;\t]/).map((p) => p.trim()).filter(Boolean);
  if (partes.length >= 2) {
    const primera = aNumero(partes[0]);
    const ultima = aNumero(partes[partes.length - 1]);
    if (primera != null && ultima == null) return { cantidad: primera, nombre: partes.slice(1).join(" ") };
    if (ultima != null && primera == null) return { cantidad: ultima, nombre: partes.slice(0, -1).join(" ") };
    if (primera != null && partes.length === 2) return { cantidad: primera, nombre: partes[1] };
  }
  let m = linea.match(/^(\d+(?:[.,]\d+)?|un|una|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce)\s*(?:x|×|pcs|pzas|pza|pz|piezas|pieza)?\s+(.+)$/i);
  if (m) return { cantidad: aNumero(m[1]) || 1, nombre: m[2].trim() };
  m = linea.match(/^(.+?)\s*(?:x|×)\s*(\d+(?:[.,]\d+)?)$/i);
  if (m) return { cantidad: aNumero(m[2]) || 1, nombre: m[1].trim() };
  m = linea.match(/^(.+?)\s*\((\d+(?:[.,]\d+)?)\s*(?:x|×|pzas|piezas|pz)?\)$/i);
  if (m) return { cantidad: aNumero(m[2]) || 1, nombre: m[1].trim() };
  m = linea.match(/^(.+?)\s+cantidad\s*[:=]?\s*(\d+(?:[.,]\d+)?)$/i);
  if (m) return { cantidad: aNumero(m[2]) || 1, nombre: m[1].trim() };
  return { cantidad: 1, nombre: linea };
}

export function parsearLista(texto) {
  const lineas = String(texto || "").split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("#") && !esEncabezado(l));
  return lineas.map((linea, index) => {
    const { cantidad, nombre } = extraerCantidadYNombre(linea);
    return { id: "linea-" + index, original: linea, nombre: nombre.trim(), cantidad: cantidad > 0 ? cantidad : 1 };
  }).filter((item) => item.nombre);
}

export function armarLinea(cantidad, nombre) {
  const n = Number(cantidad);
  const c = !n || n < 1 ? 1 : Math.round(n * 100) / 100;
  return c + " " + nombre;
}

export function cambiarCantidadEnTexto(texto, indice, nuevaCantidad) {
  const lineas = String(texto || "").split(/\r?\n/);
  const utiles = [];
  lineas.forEach((linea, i) => {
    const t = linea.trim();
    if (t && !t.startsWith("#") && !esEncabezado(t)) utiles.push(i);
  });
  const real = utiles[indice];
  if (real == null) return texto;
  const { nombre } = extraerCantidadYNombre(lineas[real]);
  const c = Math.max(1, Math.round(Number(nuevaCantidad) || 1));
  lineas[real] = armarLinea(c, nombre || lineas[real].trim());
  return lineas.join("\n");
}

export function borrarLineaEnTexto(texto, indice) {
  const lineas = String(texto || "").split(/\r?\n/);
  const utiles = [];
  lineas.forEach((linea, i) => {
    const t = linea.trim();
    if (t && !t.startsWith("#") && !esEncabezado(t)) utiles.push(i);
  });
  const real = utiles[indice];
  if (real == null) return texto;
  lineas.splice(real, 1);
  return lineas.join("\n");
}

export function agregarOSumarProducto(texto, nombreVisible) {
  const items = parsearLista(texto);
  const q = normalizar(nombreVisible);
  const idx = items.findIndex((item) => normalizar(item.nombre) === q);
  if (idx >= 0) return cambiarCantidadEnTexto(texto, idx, items[idx].cantidad + 1);
  const linea = armarLinea(1, nombreVisible);
  const prev = String(texto || "").trim();
  return prev ? prev + "\n" + linea : linea;
}

function puntaje(busqueda, producto) {
  const q = normalizar(busqueda);
  if (!q) return 0;
  const nombres = [producto.nombre, ...(producto.aliases || [])].map(normalizar);
  if (nombres.includes(q)) return 100;
  if (nombres.some((n) => n.startsWith(q) || q.startsWith(n))) return 80;
  if (nombres.some((n) => n.includes(q) || q.includes(n))) return 60;
  const palabras = q.split(" ").filter((p) => p.length > 2);
  const hits = palabras.filter((p) => nombres.some((n) => n.includes(p))).length;
  if (hits === 0) return 0;
  return 20 + hits * 15;
}

export function emparejar(item) {
  let mejor = null;
  let score = 0;
  const pool = candidatosPorNombre(item.nombre);
  for (const prod of pool.length ? pool : PRODUCTOS) {
    const s = puntaje(item.nombre, prod);
    if (s > score) { score = s; mejor = prod; }
  }
  if (score < 25) return { producto: null, score: 0 };
  return { producto: mejor, score };
}

export function precioVigente(producto, tiendaId, ofertas) {
  const oferta = (ofertas || []).find((o) => o.productoId === producto.id && o.tiendaId === tiendaId);
  if (oferta && oferta.precio > 0) return Number(oferta.precio);
  return producto.precios[tiendaId];
}

export function comparar(items, tiendas, ofertas, extras) {
  const skipIds = extras?.skipIds || {};
  const maxPorItem = extras?.maxPorItem || {};
  const antojoIds = extras?.antojoIds || {};
  return tiendas.map((tienda) => {
    let total = 0, totalBase = 0, totalAntojo = 0, encontrados = 0, faltantes = 0;
    const detalle = items.map((item) => {
      if (skipIds[item.id]) {
        return { ...item, producto: emparejar(item).producto, subtotal: 0, omitido: "Ya está en casa" };
      }
      const { producto } = emparejar(item);
      const unitario = producto ? precioVigente(producto, tienda.id, ofertas) : null;
      if (!producto || unitario == null) {
        faltantes += 1;
        return { ...item, producto: null, subtotal: null, oferta: false };
      }
      const topeOferta = Number(maxPorItem[item.id] || 0);
      if (topeOferta > 0 && unitario > topeOferta) {
        return { ...item, producto, subtotal: 0, omitido: "No llevar: está a " + unitario + " y tu tope es " + topeOferta };
      }
      const subtotal = Number((unitario * item.cantidad).toFixed(2));
      total += subtotal;
      if (antojoIds[item.id]) totalAntojo += subtotal;
      else totalBase += subtotal;
      encontrados += 1;
      return { ...item, producto, subtotal, antojo: !!antojoIds[item.id], oferta: unitario !== producto.precios[tienda.id] };
    });
    return {
      tienda,
      total: Number(total.toFixed(2)),
      totalBase: Number(totalBase.toFixed(2)),
      totalAntojo: Number(totalAntojo.toFixed(2)),
      encontrados,
      faltantes,
      detalle,
      cubreTodo: faltantes === 0 && items.length > 0,
    };
  }).sort((a, b) => a.total - b.total);
}
