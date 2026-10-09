/**
 * Utilidades de seguridad del servidor.
 *
 * Son deliberadamente pequeñas y sin dependencias: la app corre en el runtime
 * edge/serverless de Vercel, donde no hay Redis ni sesiones, así que el control
 * de abuso es “mejor esfuerzo” por instancia. Aun así evita los abusos más
 * comunes (una misma IP disparando la lectura de fotos con nuestra cuota de
 * Gemini/Groq o usando /api/marcas como proxy abierto de Open Food Facts).
 */

const MAX_LLAVES = 5000;
const ventanas = new Map();

function podar(ahora) {
  if (ventanas.size < MAX_LLAVES) return;
  for (const [clave, valor] of ventanas) {
    if (valor.reset <= ahora) ventanas.delete(clave);
  }
  // Si aun así sigue lleno (mucho tráfico en una sola ventana), se reinicia:
  // preferimos perder el conteo antes que crecer sin límite.
  if (ventanas.size >= MAX_LLAVES) ventanas.clear();
}

/**
 * Ventana deslizante en memoria.
 * @returns {{permitido: boolean, restante: number, reintentaSeg: number}}
 */
export function limiteDeUso(clave, maximo, ventanaMs) {
  const ahora = Date.now();
  podar(ahora);

  const actual = ventanas.get(clave);
  if (!actual || actual.reset <= ahora) {
    ventanas.set(clave, { usos: 1, reset: ahora + ventanaMs });
    return { permitido: true, restante: maximo - 1, reintentaSeg: Math.ceil(ventanaMs / 1000) };
  }

  actual.usos += 1;
  if (actual.usos > maximo) {
    return {
      permitido: false,
      restante: 0,
      reintentaSeg: Math.max(1, Math.ceil((actual.reset - ahora) / 1000)),
    };
  }
  return {
    permitido: true,
    restante: maximo - actual.usos,
    reintentaSeg: Math.max(1, Math.ceil((actual.reset - ahora) / 1000)),
  };
}

/**
 * IP aproximada del cliente.
 * Se toma la primera entrada de x-forwarded-for: en Vercel la plataforma
 * reescribe la cabecera y solo el primer valor es confiable.
 */
export function ipDelCliente(request) {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  const primera = forwarded.split(",")[0].trim();
  const ip = primera || request.headers.get("x-real-ip") || "desconocida";
  return ip.slice(0, 64);
}

export function cabecerasLimite(resultado, maximo) {
  return {
    "RateLimit-Limit": String(maximo),
    "RateLimit-Remaining": String(Math.max(0, resultado.restante)),
    "Retry-After": String(resultado.reintentaSeg),
  };
}

/** Solo permite data URLs de imagen: bloquea http(s) y cualquier otro esquema. */
export function esImagenDataUrlSegura(valor) {
  if (typeof valor !== "string") return false;
  if (!/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(valor)) return false;
  const base64 = valor.slice(valor.indexOf(",") + 1);
  return base64.length % 4 === 0;
}

export function mimeDeDataUrl(valor) {
  return (valor.match(/^data:(image\/(?:jpeg|png|webp));base64,/) || [])[1] || "image/jpeg";
}

/**
 * Limpia el texto que devuelve el modelo antes de mandarlo al navegador:
 * sin caracteres de control, sin renglones gigantes y con tope de tamaño.
 */
export function limpiarTextoModelo(texto) {
  return String(texto || "")
    .replace(/\r/g, "\n")
    // Conserva saltos de línea y elimina el resto de caracteres de control.
    .replace(/[^\P{Cc}\n]/gu, "")
    .split("\n")
    .map((linea) => linea.trim().slice(0, 120))
    .filter(Boolean)
    .slice(0, 200)
    .join("\n")
    .slice(0, 4000);
}

/** Modelo fijado por variable de entorno: solo caracteres seguros para la URL. */
export function modeloConfigurado(valor) {
  const modelo = String(valor || "").trim();
  return /^[A-Za-z0-9._\-/]{1,64}$/.test(modelo) ? modelo : "";
}
