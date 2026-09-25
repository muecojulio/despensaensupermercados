export const ORDEN_PASILLO = {
  fruta: 1,
  despensa: 2,
  hogar: 3,
  bebidas: 4,
  lacteos: 5,
  carnes: 6,
};

export const NOMBRE_PASILLO = {
  fruta: "1. Frutas y verduras",
  despensa: "2. Abarrotes",
  hogar: "3. Limpieza y papel",
  bebidas: "4. Bebidas",
  lacteos: "5. Refrigerados",
  carnes: "6. Carnes (al final)",
};

export const PESO_KG = {
  leche_1l: 1,
  huevo_12: 0.7,
  huevo_30: 1.8,
  tortilla_kg: 1,
  pan_caja: 0.7,
  arroz_kg: 1,
  frijol_kg: 1,
  aceite_1l: 0.95,
  azucar_kg: 1,
  sal: 1,
  pasta: 0.2,
  atun: 0.15,
  jitomate_kg: 1,
  cebolla_kg: 1,
  papa_kg: 1,
  platano_kg: 1,
  manzana_kg: 1,
  limon_kg: 1,
  aguacate_kg: 1,
  pollo_kg: 1,
  pechuga_kg: 1,
  molida_kg: 1,
  yogurt: 1,
  queso_oaxaca: 0.4,
  crema: 0.4,
  mantequilla: 0.09,
  cafe: 0.18,
  avena: 0.8,
  lentejas: 0.5,
  agua_15: 1.5,
  refresco: 3,
  papel_4: 0.6,
  jabon: 0.15,
  detergente: 1,
  cloro: 1,
  aceite_oliva: 0.5,
  cereal: 0.5,
  galletas: 0.16,
};

export const SUSTITUTOS = {
  aguacate_kg: "Si no hay aguacate: guacamole ya hecho o más jitomate para la comida.",
  jitomate_kg: "Si no hay jitomate: salsa de lata o jitomate verde.",
  pollo_kg: "Si no hay pollo entero: pechuga o huevo.",
  pechuga_kg: "Si no hay pechuga: pollo entero o atún.",
  leche_1l: "Si no hay leche: yogurt o leche en polvo.",
  huevo_12: "Si el huevo está caro: atún o frijol.",
  platano_kg: "Si no hay plátano: manzana o pan dulce.",
  papel_4: "Si el papel está caro: lleva menos rollos o espera oferta.",
};

export const RECETAS = [
  {
    id: "sopa",
    nombre: "Sopa de fideo",
    items: ["pasta", "jitomate", "pollo", "cebolla", "aceite"],
  },
  {
    id: "huevos",
    nombre: "Huevos con tortilla",
    items: ["huevo", "tortillas", "jitomate", "cebolla"],
  },
  {
    id: "frijoles",
    nombre: "Frijoles de la olla",
    items: ["frijol", "cebolla", "aceite"],
  },
  {
    id: "ensalada",
    nombre: "Ensalada de pollo",
    items: ["pechuga", "aguacate", "jitomate", "limon", "cebolla"],
  },
];

export function avisoDiaCompra() {
  const d = new Date();
  const dia = d.getDay();
  const fecha = d.getDate();
  const partes = [];
  if (dia === 6) partes.push("Hoy es sábado: suele haber más gente. Si puedes, ve más temprano.");
  if (dia === 0) partes.push("Domingo: algunas sucursales cierran más temprano.");
  if (fecha <= 5 || (fecha >= 15 && fecha <= 18)) {
    partes.push("Estamos cerca de quincena: más filas y anaquel más vacío en la tarde.");
  }
  return partes.join(" ");
}
