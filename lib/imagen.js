/**
 * Prepara la foto de la lista antes de mandarla al servidor.
 *
 * Vercel corta los cuerpos de petición arriba de ~4.5 MB, y una foto de
 * celular pesa mucho más. Aquí se reduce a un lado máximo y se recomprime
 * a JPEG para que el POST siempre entre.
 */
function leerDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("No pude leer la foto."));
    reader.readAsDataURL(file);
  });
}

export async function comprimirImagen(file, opciones = {}) {
  const maxLado = opciones.maxLado || 1600;
  const calidad = opciones.calidad || 0.82;
  const original = await leerDataUrl(file);

  if (typeof document === "undefined" || typeof createImageBitmap !== "function") {
    return original;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const escala = Math.min(1, maxLado / Math.max(bitmap.width || 1, bitmap.height || 1));
    const ancho = Math.max(1, Math.round((bitmap.width || 1) * escala));
    const alto = Math.max(1, Math.round((bitmap.height || 1) * escala));
    const lienzo = document.createElement("canvas");
    lienzo.width = ancho;
    lienzo.height = alto;
    const ctx = lienzo.getContext("2d");
    if (!ctx) return original;
    ctx.drawImage(bitmap, 0, 0, ancho, alto);
    if (bitmap.close) bitmap.close();
    const salida = lienzo.toDataURL("image/jpeg", calidad);
    return salida && salida.length < original.length ? salida : original;
  } catch {
    return original;
  }
}
