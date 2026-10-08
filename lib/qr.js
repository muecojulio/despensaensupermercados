/**
 * Generador de códigos QR (ISO/IEC 18004) sin dependencias.
 *
 * Solo implementa el modo byte (UTF-8), que es lo que usa la app: enlaces y
 * texto corto. Con esto el QR se dibuja en un <canvas> y se descarga como PNG
 * sin pedirle nada a ningún servicio externo, así que también funciona sin
 * internet y dentro de la app instalada.
 *
 * Uso:
 *   const { size, modulos } = generarQR("https://ejemplo.com", "M");
 *   // modulos es un Uint8Array de size * size; 1 = módulo oscuro.
 */

// Código de corrección por bloque: nivel de corrección → versión (1-40).
const ECC_POR_BLOQUE = {
  L: [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  M: [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
  Q: [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  H: [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
};

// Cantidad de bloques de corrección: nivel → versión (1-40).
const BLOQUES_ECC = {
  L: [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
  M: [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
  Q: [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
  H: [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81],
};

// Bits que identifican el nivel en la información de formato.
const BITS_NIVEL = { L: 1, M: 0, Q: 3, H: 2 };

const PENALIZACION_N1 = 3;
const PENALIZACION_N2 = 3;
const PENALIZACION_N3 = 40;
const PENALIZACION_N4 = 10;

// Tablas de campo de Galois GF(256) con el polinomio primitivo 0x11D.
const GF_EXP = new Uint8Array(256);
const GF_LOG = new Uint8Array(256);

(function construirTablasGalois() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  GF_EXP[255] = GF_EXP[0];
})();

function multiplicar(a, b) {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[(GF_LOG[a] + GF_LOG[b]) % 255];
}

/** Polinomio generador de Reed-Solomon para `grado` códigos de corrección. */
function divisorReedSolomon(grado) {
  const divisor = new Uint8Array(grado);
  divisor[grado - 1] = 1;
  let raiz = 1;
  for (let i = 0; i < grado; i++) {
    for (let j = 0; j < grado; j++) {
      divisor[j] = multiplicar(divisor[j], raiz);
      if (j + 1 < grado) divisor[j] ^= divisor[j + 1];
    }
    raiz = multiplicar(raiz, 0x02);
  }
  return divisor;
}

function residuoReedSolomon(datos, divisor) {
  const residuo = new Uint8Array(divisor.length);
  for (const byte of datos) {
    const factor = byte ^ residuo[0];
    residuo.copyWithin(0, 1);
    residuo[residuo.length - 1] = 0;
    for (let i = 0; i < divisor.length; i++) residuo[i] ^= multiplicar(divisor[i], factor);
  }
  return residuo;
}

/** Total de módulos de datos (sin contar los de función) de una versión. */
function modulosDeDatos(version) {
  let total = (16 * version + 128) * version + 64;
  if (version >= 2) {
    const alineaciones = Math.floor(version / 7) + 2;
    total -= (25 * alineaciones - 10) * alineaciones - 55;
    if (version >= 7) total -= 36;
  }
  return total;
}

/** Códigos (bytes) disponibles para datos en una versión y nivel. */
function codigosDeDatos(version, nivel) {
  return Math.floor(modulosDeDatos(version) / 8) - ECC_POR_BLOQUE[nivel][version] * BLOQUES_ECC[nivel][version];
}

function posicionesAlineacion(version) {
  if (version === 1) return [];
  const cantidad = Math.floor(version / 7) + 2;
  const size = version * 4 + 17;
  const paso = version === 32 ? 26 : Math.ceil((version * 4 + 4) / (cantidad * 2 - 2)) * 2;
  const posiciones = [6];
  for (let pos = size - 7; posiciones.length < cantidad; pos -= paso) posiciones.splice(1, 0, pos);
  return posiciones;
}

function bit(byte, indice) {
  return ((byte >>> indice) & 1) !== 0;
}

/**
 * Elige versión y arma la cadena de bits con modo byte, terminador y relleno.
 */
function codificarDatos(bytes, nivel) {
  for (let version = 1; version <= 40; version++) {
    const capacidad = codigosDeDatos(version, nivel) * 8;
    const bitsCuenta = version < 10 ? 8 : 16;
    const necesarios = 4 + bitsCuenta + bytes.length * 8;
    if (bytes.length >= 1 << bitsCuenta || necesarios > capacidad) continue;

    const salida = [];
    let acumulado = 0;
    let usados = 0;
    const push = (valor, cantidad) => {
      for (let i = cantidad - 1; i >= 0; i--) {
        acumulado = (acumulado << 1) | ((valor >>> i) & 1);
        usados++;
        if (usados === 8) {
          salida.push(acumulado);
          acumulado = 0;
          usados = 0;
        }
      }
    };

    push(0b0100, 4); // modo byte
    push(bytes.length, bitsCuenta);
    for (const byte of bytes) push(byte, 8);

    // Terminador y relleno hasta completar la capacidad.
    push(0, Math.min(4, capacidad - (salida.length * 8 + usados)));
    push(0, (8 - usados) % 8);
    for (let relleno = 0xec; salida.length * 8 + usados < capacidad; relleno ^= 0xec ^ 0x11) push(relleno, 8);

    return { version, codigos: Uint8Array.from(salida) };
  }
  return null;
}

/** Reparte los códigos en bloques, agrega corrección y los entrelaza. */
function agregarCorreccion(codigos, version, nivel) {
  const bloques = BLOQUES_ECC[nivel][version];
  const eccPorBloque = ECC_POR_BLOQUE[nivel][version];
  const crudos = Math.floor(modulosDeDatos(version) / 8);
  const cortos = bloques - (crudos % bloques);
  const largos = bloques - cortos;
  const divisor = divisorReedSolomon(eccPorBloque);

  const datosPorBloque = [];
  const eccPorBloqueLista = [];
  let indice = 0;
  for (let bloque = 0; bloque < bloques; bloque++) {
    const tamaño = Math.floor(crudos / bloques) - eccPorBloque + (bloque < cortos ? 0 : 1);
    const datos = codigos.slice(indice, indice + tamaño);
    indice += tamaño;
    datosPorBloque.push(datos);
    eccPorBloqueLista.push(residuoReedSolomon(datos, divisor));
  }

  const salida = new Uint8Array(crudos);
  let posicion = 0;
  const maxDatos = Math.max(...datosPorBloque.map((datos) => datos.length));
  for (let i = 0; i < maxDatos; i++) {
    for (const datos of datosPorBloque) {
      if (i < datos.length) salida[posicion++] = datos[i];
    }
  }
  for (let i = 0; i < eccPorBloque; i++) {
    for (const ecc of eccPorBloqueLista) salida[posicion++] = ecc[i];
  }
  return salida;
}

function mascara(numero, x, y) {
  switch (numero) {
    case 0: return (x + y) % 2 === 0;
    case 1: return y % 2 === 0;
    case 2: return x % 3 === 0;
    case 3: return (x + y) % 3 === 0;
    case 4: return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
    case 5: return ((x * y) % 2) + ((x * y) % 3) === 0;
    case 6: return (((x * y) % 2) + ((x * y) % 3)) % 2 === 0;
    default: return (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
  }
}

/**
 * Devuelve los módulos del QR para `texto`.
 * @param {string} texto contenido a codificar
 * @param {"L"|"M"|"Q"|"H"} nivel corrección de errores
 * @returns {{ size: number, modulos: Uint8Array, version: number }}
 */
export function generarQR(texto, nivel = "M") {
  const nivelUsado = nivel in BITS_NIVEL ? nivel : "M";
  const bytes = Array.from(new TextEncoder().encode(String(texto)));
  const codificado = codificarDatos(bytes, nivelUsado);
  if (!codificado) throw new Error("El texto es demasiado largo para un código QR.");

  const { version, codigos } = codificado;
  const size = version * 4 + 17;
  let modulos = new Uint8Array(size * size);
  const esFuncion = new Uint8Array(size * size);

  const poner = (x, y, oscuro) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    modulos[y * size + x] = oscuro ? 1 : 0;
    esFuncion[y * size + x] = 1;
  };

  function dibujarBusqueda(cx, cy) {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const distancia = Math.max(Math.abs(dx), Math.abs(dy));
        poner(cx + dx, cy + dy, distancia !== 2 && distancia !== 4);
      }
    }
  }

  function dibujarAlineacion(cx, cy) {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) poner(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }
  }

  function dibujarFormato(mascaraNumero) {
    const datos = (BITS_NIVEL[nivelUsado] << 3) | mascaraNumero;
    let residuo = datos;
    for (let i = 0; i < 10; i++) residuo = (residuo << 1) ^ ((residuo >>> 9) * 0x537);
    const bits = ((datos << 10) | residuo) ^ 0x5412;

    for (let i = 0; i <= 5; i++) poner(8, i, bit(bits, i));
    poner(8, 7, bit(bits, 6));
    poner(8, 8, bit(bits, 7));
    poner(7, 8, bit(bits, 8));
    for (let i = 9; i < 15; i++) poner(14 - i, 8, bit(bits, i));

    for (let i = 0; i < 8; i++) poner(size - 1 - i, 8, bit(bits, i));
    for (let i = 8; i < 15; i++) poner(8, size - 15 + i, bit(bits, i));
    poner(8, size - 8, true); // módulo siempre oscuro
  }

  function dibujarVersion() {
    if (version < 7) return;
    let residuo = version;
    for (let i = 0; i < 12; i++) residuo = (residuo << 1) ^ ((residuo >>> 11) * 0x1f25);
    const bits = (version << 12) | residuo;
    for (let i = 0; i < 18; i++) {
      const valor = bit(bits, i);
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      poner(a, b, valor);
      poner(b, a, valor);
    }
  }

  // Patrones de función: sincronía, búsqueda y alineación.
  for (let i = 0; i < size; i++) {
    poner(6, i, i % 2 === 0);
    poner(i, 6, i % 2 === 0);
  }
  dibujarBusqueda(3, 3);
  dibujarBusqueda(size - 4, 3);
  dibujarBusqueda(3, size - 4);

  const alineaciones = posicionesAlineacion(version);
  for (let i = 0; i < alineaciones.length; i++) {
    for (let j = 0; j < alineaciones.length; j++) {
      const esquina = (i === 0 && j === 0)
        || (i === 0 && j === alineaciones.length - 1)
        || (i === alineaciones.length - 1 && j === 0);
      if (!esquina) dibujarAlineacion(alineaciones[i], alineaciones[j]);
    }
  }

  dibujarFormato(0);
  dibujarVersion();

  // Códigos en zigzag, de abajo hacia arriba y en columnas de a dos.
  const conCorreccion = agregarCorreccion(codigos, version, nivelUsado);
  let bitIndex = 0;
  for (let derecha = size - 1; derecha >= 1; derecha -= 2) {
    if (derecha === 6) derecha = 5;
    for (let vertical = 0; vertical < size; vertical++) {
      for (let j = 0; j < 2; j++) {
        const x = derecha - j;
        const haciaArriba = ((derecha + 1) & 2) === 0;
        const y = haciaArriba ? size - 1 - vertical : vertical;
        const pos = y * size + x;
        if (esFuncion[pos] || bitIndex >= conCorreccion.length * 8) continue;
        modulos[pos] = bit(conCorreccion[bitIndex >>> 3], 7 - (bitIndex & 7)) ? 1 : 0;
        bitIndex++;
      }
    }
  }

  // Máscara con mejor puntuación (se prueban las 8 y gana la de menor penalización).
  let mejorPenalizacion = Infinity;
  let mejorModulos = null;

  for (let numero = 0; numero < 8; numero++) {
    alternarMascara(modulos, esFuncion, size, numero);
    dibujarFormato(numero);
    const puntos = calcularPenalizacion(modulos, size);
    if (puntos < mejorPenalizacion) {
      mejorPenalizacion = puntos;
      mejorModulos = modulos.slice();
    }
    alternarMascara(modulos, esFuncion, size, numero); // xor: la vuelve a quitar
  }

  return { size, modulos: mejorModulos, version };
}

/** Aplica (o quita, porque el xor es reversible) la máscara sobre los datos. */
function alternarMascara(modulos, esFuncion, size, numero) {
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const pos = y * size + x;
      if (!esFuncion[pos] && mascara(numero, x, y)) modulos[pos] ^= 1;
    }
  }
}

function calcularPenalizacion(modulos, size) {
  let puntos = 0;

  const historiaVacia = () => [0, 0, 0, 0, 0, 0, 0];
  const agregarHistoria = (largo, historia) => {
    if (historia[0] === 0) largo += size; // borde claro imaginario
    historia.pop();
    historia.unshift(largo);
  };
  const contarPatrones = (historia) => {
    const n = historia[1];
    const nucleo = n > 0 && historia[2] === n && historia[3] === n * 3 && historia[4] === n && historia[5] === n;
    return (nucleo && historia[0] >= n * 4 && historia[6] >= n ? 1 : 0)
      + (nucleo && historia[6] >= n * 4 && historia[0] >= n ? 1 : 0);
  };
  const terminarYContar = (colorActual, largoActual, historia) => {
    let largo = largoActual;
    if (colorActual) {
      agregarHistoria(largo, historia);
      largo = 0;
    }
    largo += size;
    agregarHistoria(largo, historia);
    return contarPatrones(historia);
  };

  // Regla 1 y 3 por renglón.
  for (let y = 0; y < size; y++) {
    let color = false;
    let corrida = 0;
    const historia = historiaVacia();
    for (let x = 0; x < size; x++) {
      if (modulos[y * size + x] === (color ? 1 : 0)) {
        corrida++;
        if (corrida === 5) puntos += PENALIZACION_N1;
        else if (corrida > 5) puntos++;
      } else {
        agregarHistoria(corrida, historia);
        if (!color) puntos += contarPatrones(historia) * PENALIZACION_N3;
        color = modulos[y * size + x] === 1;
        corrida = 1;
      }
    }
    puntos += terminarYContar(color, corrida, historia) * PENALIZACION_N3;
  }

  // Regla 1 y 3 por columna.
  for (let x = 0; x < size; x++) {
    let color = false;
    let corrida = 0;
    const historia = historiaVacia();
    for (let y = 0; y < size; y++) {
      if (modulos[y * size + x] === (color ? 1 : 0)) {
        corrida++;
        if (corrida === 5) puntos += PENALIZACION_N1;
        else if (corrida > 5) puntos++;
      } else {
        agregarHistoria(corrida, historia);
        if (!color) puntos += contarPatrones(historia) * PENALIZACION_N3;
        color = modulos[y * size + x] === 1;
        corrida = 1;
      }
    }
    puntos += terminarYContar(color, corrida, historia) * PENALIZACION_N3;
  }

  // Regla 2: bloques 2x2 del mismo color.
  for (let y = 0; y < size - 1; y++) {
    for (let x = 0; x < size - 1; x++) {
      const valor = modulos[y * size + x];
      if (valor === modulos[y * size + x + 1] && valor === modulos[(y + 1) * size + x] && valor === modulos[(y + 1) * size + x + 1]) {
        puntos += PENALIZACION_N2;
      }
    }
  }

  // Regla 4: proporción de módulos oscuros.
  let oscuros = 0;
  for (let i = 0; i < modulos.length; i++) oscuros += modulos[i];
  const total = size * size;
  const k = Math.ceil(Math.abs(oscuros * 20 - total * 10) / total) - 1;
  return puntos + k * PENALIZACION_N4;
}

/**
 * Dibuja el QR en un canvas 2D ya existente.
 * Devuelve el tamaño real en píxeles que ocupó el dibujo.
 */
export function dibujarQR(canvas, texto, opciones = {}) {
  const {
    nivel = "M",
    pixeles = 512,
    margen = 4, // zona tranquila, en módulos
    oscuro = "#12352a",
    claro = "#ffffff",
    pie = "",
  } = opciones;

  const { size, modulos } = generarQR(texto, nivel);
  const total = size + margen * 2;
  const altoPie = pie ? Math.round(total * 0.13) : 0;
  const escala = Math.max(1, Math.floor(pixeles / total));
  const ancho = total * escala;
  const alto = total * escala + altoPie * escala;

  canvas.width = ancho;
  canvas.height = alto;

  const ctx = canvas.getContext("2d");
  if (!ctx) return { ancho, alto };

  ctx.fillStyle = claro;
  ctx.fillRect(0, 0, ancho, alto);
  ctx.fillStyle = oscuro;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (modulos[y * size + x]) ctx.fillRect((x + margen) * escala, (y + margen) * escala, escala, escala);
    }
  }

  if (pie) {
    ctx.fillStyle = oscuro;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `600 ${Math.round(escala * 2.4)}px "Segoe UI", system-ui, sans-serif`;
    ctx.fillText(pie, ancho / 2, total * escala + (altoPie * escala) / 2, ancho - escala * 2);
  }

  return { ancho, alto };
}
