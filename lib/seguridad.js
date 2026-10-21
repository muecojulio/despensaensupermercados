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
 * En el hosting principal se prefiere x-real-ip (puesta por la plataforma). En
 * otros proxies, el último elemento de x-forwarded-for es el añadido por el
 * proxy más cercano; no se confía en valores anteriores que el cliente puede
 * falsificar.
 */
export function ipDelCliente(request) {
  const real = request.headers.get("x-real-ip") || "";
  const forwarded = request.headers.get("x-forwarded-for") || "";
  const desdeProxy = forwarded.split(",").at(-1)?.trim() || "";
  const ip = real.trim() || desdeProxy || "desconocida";
  return ip.slice(0, 64);
}

export function cabecerasLimite(resultado, maximo) {
  return {
    "RateLimit-Limit": String(maximo),
    "RateLimit-Remaining": String(Math.max(0, resultado.restante)),
    "Retry-After": String(resultado.reintentaSeg),
  };
}

/**
 * Solo permite imágenes JPEG, PNG o WebP como data URL, bloquea http(s) y
 * comprueba la firma binaria para que no baste con renombrar HTML o SVG.
 * Se llama después del límite de cuerpo; Buffer se usa solo en la ruta Node.
 */
export function esImagenDataUrlSegura(valor) {
  if (typeof valor !== "string") return false;
  const match = valor.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/);
  if (!match) return false;
  const [, mime, base64] = match;
  if (base64.length % 4 !== 0) return false;

  let bytes;
  try {
    bytes = Buffer.from(base64, "base64");
  } catch {
    return false;
  }
  if (!bytes.length) return false;

  if (mime === "image/jpeg") {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mime === "image/png") {
    return bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  }
  return (
    mime === "image/webp" &&
    bytes.length >= 12 &&
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP"
  );
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

/**
 * Bases de APIs públicas con respaldo por variable de entorno.
 *
 * Las APIs sin key tienen una base pública por omisión. Si el operador define
 * la variable (p. ej. un espejo propio o el subdominio del país), esa base se
 * prueba PRIMERO y, si no responde, se sigue con las públicas. Solo se aceptan
 * URLs https sin credenciales, sin query ni fragmento: una variable mal pegada
 * nunca debe convertir la ruta en un proxy abierto ni colar una key en la URL.
 *
 * @param {string} valorEnv valor crudo de la variable de entorno
 * @param {...string} porOmision bases públicas en orden de preferencia
 * @returns {string[]} bases únicas, sin diagonal final
 */
export function basesExternas(valorEnv, ...porOmision) {
  const candidatas = [String(valorEnv || "").trim(), ...porOmision];
  const vistas = new Set();
  const salida = [];
  for (const cruda of candidatas) {
    if (!cruda) continue;
    let url;
    try {
      url = new URL(cruda);
    } catch {
      continue;
    }
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) continue;
    const base = (url.origin + url.pathname).replace(/\/+$/, "");
    if (vistas.has(base)) continue;
    vistas.add(base);
    salida.push(base);
  }
  return salida;
}

/**
 * Coordenada segura para rutas de servidor: número finito dentro de rango.
 * Devuelve null si no sirve, para responder 400 sin llamar a terceros.
 */
export function coordenadaSegura(valor, minimo, maximo) {
  // Number(null) y Number("") valen 0: sin este corte, una petición sin lat
  // se aceptaría como coordenada 0,0 en vez de responderse 400.
  if (valor == null || (typeof valor === "string" && !valor.trim())) return null;
  const n = Number(valor);
  return Number.isFinite(n) && n >= minimo && n <= maximo ? n : null;
}

/** Modelo fijado por variable de entorno: solo caracteres seguros para la URL. */
export function modeloConfigurado(valor) {
  const modelo = String(valor || "").trim();
  return /^[A-Za-z0-9._\-/]{1,64}$/.test(modelo) ? modelo : "";
}
