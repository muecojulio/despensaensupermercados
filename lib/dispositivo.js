/**
 * Detecta en qué dispositivo está abierta la app para explicar cómo instalarla.
 *
 * iPadOS se disfraza de Mac en el user agent, así que también se mira
 * maxTouchPoints: una "Mac" con más de un punto táctil es un iPad.
 */

const PASOS = {
  ipad: [
    "Abre esta página en Safari: en iPad la instalación se hace desde Safari.",
    "Toca el botón Compartir (el cuadro con una flecha, arriba a la derecha).",
    "Elige “Agregar a pantalla de inicio” y después “Agregar”.",
    "Queda en tu pantalla de inicio y se abre a pantalla completa, también sin internet.",
  ],
  iphone: [
    "Abre esta página en Safari: en iPhone la instalación se hace desde Safari.",
    "Toca el botón Compartir (el cuadro con una flecha, abajo en el centro).",
    "Elige “Agregar a pantalla de inicio” y después “Agregar”.",
    "Queda en tu pantalla de inicio y se abre a pantalla completa, también sin internet.",
  ],
  android: [
    "Abre esta página en Chrome.",
    "Si abajo aparece el aviso “Instalar Despensa MX”, tócalo.",
    "Si no aparece: menú ⋮ → “Instalar app” o “Agregar a pantalla de inicio”.",
    "Queda junto a tus otras apps y funciona sin internet.",
  ],
  mac: [
    "En Safari 17 o más reciente: menú Archivo → “Agregar al Dock” (o botón Compartir → “Agregar al Dock”).",
    "En Chrome o Edge: toca el ícono de instalar de la barra de direcciones y elige “Instalar”.",
    "Se abre en su propia ventana, sin pestañas del navegador, y aparece en el Launchpad.",
  ],
  windows: [
    "Abre esta página en Chrome o en Edge.",
    "Toca el ícono de instalar de la barra de direcciones o ve al menú ⋮ → “Instalar Despensa MX…”.",
    "Confirma con “Instalar”.",
    "Queda como app de escritorio: se abre en su propia ventana y aparece en el menú Inicio.",
  ],
  linux: [
    "Abre esta página en Chrome o en Edge.",
    "Toca el ícono de instalar de la barra de direcciones o ve al menú ⋮ → “Instalar Despensa MX…”.",
    "Confirma con “Instalar”.",
    "Queda como app de escritorio y se abre en su propia ventana.",
  ],
  otro: [
    "Abre el enlace con Chrome, Edge o Safari.",
    "Busca “Instalar”, “Instalar app” o “Agregar a pantalla de inicio” en el menú del navegador.",
    "Si tu navegador no la ofrece, actualízalo o abre el enlace en Chrome, Edge o Safari.",
  ],
};

const TITULOS = {
  ipad: "iPad",
  iphone: "iPhone",
  android: "Android",
  mac: "Mac",
  windows: "Windows",
  linux: "Linux",
  otro: "otro navegador",
};

/** Devuelve null si se llama desde el servidor (aún no hay navigator). */
export function detectarDispositivo() {
  if (typeof navigator === "undefined") return null;

  const ua = navigator.userAgent || "";
  const plataforma = navigator.platform || "";
  const touch = typeof navigator.maxTouchPoints === "number" ? navigator.maxTouchPoints : 0;

  const ipad = /iPad/.test(ua) || (/Macintosh|Mac OS X/.test(ua) && touch > 1);
  const iphone = /iP(hone|od)/.test(ua) && !ipad;
  const ios = ipad || iphone;
  const android = /Android/.test(ua);
  const mac = !ios && /Macintosh|Mac OS X/.test(ua);
  const windows = /Windows/.test(ua);
  const linux = /Linux|X11/.test(ua) && !android;
  const chromium = /(Chrome|Chromium|Edg)\//.test(ua) && !/(OPR|Firefox|YaBrowser)/.test(ua);
  const safari = /Safari\//.test(ua) && !/(Chrome|Chromium|Edg|Firefox|CriOS|FxiOS)/.test(ua);

  return {
    ios, ipad, iphone, android, mac, windows, linux, chromium, safari,
    movil: ios || android,
    escritorio: !ios && !android,
    plataforma,
  };
}

/** Clave de instrucciones que le toca a este dispositivo. */
export function claveDispositivo(dispositivo) {
  if (!dispositivo) return "otro";
  if (dispositivo.ipad) return "ipad";
  if (dispositivo.iphone) return "iphone";
  if (dispositivo.android) return "android";
  if (dispositivo.mac) return "mac";
  if (dispositivo.windows) return "windows";
  if (dispositivo.linux) return "linux";
  return "otro";
}

export function guiaInstalacion(clave) {
  const llave = clave in PASOS ? clave : "otro";
  return { clave: llave, titulo: TITULOS[llave], pasos: PASOS[llave] };
}

/** Listado para mostrar “pasos en cada dispositivo” (celular, iPad y computadora). */
export function guiasCompletas() {
  return [
    { id: "ipad", etiqueta: "iPad y iPhone", claves: ["ipad", "iphone"] },
    { id: "android", etiqueta: "Celular Android", claves: ["android"] },
    { id: "computadora", etiqueta: "Computadora (Mac, Windows o Linux)", claves: ["mac", "windows", "linux"] },
  ];
}
