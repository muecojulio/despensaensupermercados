import { parsearLista } from "./despensa";

const TEXTO = [".txt", ".csv", ".tsv", ".text", ".md", ".log", ".json"];
const EXCEL = [".xlsx", ".xls", ".ods"];
const WORD = [".doc", ".docx", ".odt", ".rtf"];
const PDF = [".pdf"];
const IMAGEN = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".heic", ".bmp"];

function extDe(nombre) {
  const n = String(nombre || "").toLowerCase();
  const i = n.lastIndexOf(".");
  return i >= 0 ? n.slice(i) : "";
}

function limpiaTextoSucio(texto) {
  return String(texto || "")
    .replace(/\u0000/g, " ")
    .split(/\r?\n/)
    .map((l) => l.replace(/[^\S\r\n]+/g, " ").trim())
    .filter((l) => l.length >= 2 && /[a-záéíóúñ]/i.test(l))
    .join("\n");
}

function leerTexto(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("No pude leer el archivo"));
    reader.readAsText(file);
  });
}

async function leerExcel(file) {
  throw new Error(
    "Para no fallar en Vercel, el Excel .xlsx hay que guardarlo como CSV: En Excel → Archivo → Guardar como → CSV. El .txt y el .csv sí entran directo."
  );
}

export async function leerCualquierArchivo(file) {
  const ext = extDe(file.name);
  const tipo = file.type || "";

  if (TEXTO.includes(ext) || tipo.startsWith("text/") || ext === ".json") {
    const texto = await leerTexto(file);
    return { texto, aviso: "Leí el archivo de texto." };
  }

  if (EXCEL.includes(ext) || tipo.includes("spreadsheet") || tipo.includes("excel")) {
    const texto = await leerExcel(file);
    return { texto, aviso: "Leí la primera hoja del Excel." };
  }

  if (IMAGEN.includes(ext) || tipo.startsWith("image/")) {
    throw new Error(
      "Recibí la imagen, pero para leer una foto de la lista se necesita una key de IA. Por ahora sube .txt, .csv o Excel, o escríbela abajo."
    );
  }

  if (PDF.includes(ext) || tipo === "application/pdf" || WORD.includes(ext)) {
    const crudo = await leerTexto(file);
    const texto = limpiaTextoSucio(crudo);
    if (parsearLista(texto).length >= 2) {
      return { texto, aviso: "Saqué el texto que pude del archivo. Revisa que no falte nada." };
    }
    throw new Error(
      "Ese PDF o Word no se pudo leer bien. Guárdalo como .txt, .csv o Excel e inténtalo de nuevo."
    );
  }

  const intento = await leerTexto(file);
  const texto = limpiaTextoSucio(intento);
  if (parsearLista(texto).length >= 1) {
    return { texto, aviso: "Intenté leer el archivo. Revisa la lista." };
  }
  throw new Error("No pude sacar la lista de ese archivo. Prueba .txt o .csv.");
}
