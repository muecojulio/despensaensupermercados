/** Marcas habituales en súpers de México. Se combinan con Open Food Facts. */
export const MARCAS_POR_PRODUCTO = {
  leche_1l: ["Lala", "Alpura", "Santa Clara", "Sello Rojo", "Nutrileche", "Great Value", "Aurrerá"],
  huevo_12: ["San Juan", "Bachoco", "El Calvario", "Free Range", "Great Value"],
  huevo_30: ["San Juan", "Bachoco", "El Calvario", "Great Value"],
  tortilla_kg: ["De la tortillería", "Tía Rosa", "Mission", "Trigo"],
  pan_caja: ["Bimbo", "Wonder", "Oroweat", "Great Value", "Aurrerá"],
  arroz_kg: ["Verde Valle", "Schettino", "Morelos", "Great Value", "Precissimo"],
  frijol_kg: ["Verde Valle", "La Sierra", "Isadora", "Great Value"],
  aceite_1l: ["Nutrioli", "1-2-3", "Capullo", "Cristal", "Great Value"],
  azucar_kg: ["Zulka", "Great Value", "Marinela", "Purisima"],
  sal: ["La Fina", "Cisne", "Great Value"],
  pasta: ["Barilla", "La Moderna", "Italpasta", "Great Value"],
  atun: ["Dolores", "Tuny", "Herdez", "Great Value"],
  jitomate_kg: ["Del campo", "Orgánico"],
  cebolla_kg: ["Del campo"],
  papa_kg: ["Del campo"],
  platano_kg: ["Del campo"],
  manzana_kg: ["Del campo", "Washington"],
  limon_kg: ["Del campo"],
  aguacate_kg: ["Del campo", "Hass"],
  pollo_kg: ["Bachoco", "Pilgrim's", "Del campo"],
  pechuga_kg: ["Bachoco", "Pilgrim's"],
  molida_kg: ["SuKarne", "Del campo"],
  yogurt: ["Lala", "Alpura", "Yoplait", "Danone", "Santa Clara"],
  queso_oaxaca: ["Lala", "Chilchota", "La Villita", "Great Value"],
  crema: ["Lala", "Alpura", "Great Value"],
  mantequilla: ["Lala", "Chipilo", "Gloria"],
  cafe: ["Nescafé", "Legal", "International", "Great Value"],
  avena: ["Quaker", "3 Minutos", "Great Value"],
  lentejas: ["Verde Valle", "La Sierra", "Great Value"],
  agua_15: ["Bonafont", "Ciel", "E-Pura", "Santa María", "Great Value"],
  refresco: ["Coca-Cola", "Pepsi", "Mundet", "Sidral Aga"],
  papel_4: ["Pétalo", "Suavel", "Regal", "Great Value"],
  jabon: ["Zote", "Palmolive", "Dove", "Escudo"],
  detergente: ["Roma", "Ariel", "Ace", "Foca", "Great Value"],
  cloro: ["Cloralex", "Clorox", "Pinol", "Great Value"],
  aceite_oliva: ["Carbonell", "Borges", "Great Value", "Capullo"],
  cereal: ["Kellogg's", "Nestlé", "Quaker", "Great Value"],
  galletas: ["Gamesa", "Marinela", "Cuétara", "Great Value"],
};

export function marcasLocalesDe(productoId) {
  return MARCAS_POR_PRODUCTO[productoId] || [];
}

/**
 * Precio relativo estimado de cada marca frente a una marca "estándar" (1.00)
 * del mismo producto. NO son precios de anaquel: sirven para ordenar las
 * sugerencias de marcas más baratas y estimar el ahorro (p. ej. la marca
 * propia de la tienda suele costar ~18 % menos y una premium ~12 % más).
 * La clave se compara sin acentos ni mayúsculas (ver lib/marcas.js).
 */
export const PRECIO_RELATIVO_MARCA = {
  // Económicas: marcas propias / de descuento.
  "great value": 0.82, aurrera: 0.8, precissimo: 0.78, "marca propia": 0.8,
  "del campo": 0.9, "de la tortilleria": 0.88, purisima: 0.9, cristal: 0.92,
  "la sierra": 0.92, "3 minutos": 0.9, roma: 0.88, foca: 0.9, zote: 0.9,
  legal: 0.92, "la fina": 0.95, cisne: 0.95, suavel: 0.92, regal: 0.94,
  tuny: 0.95, italpasta: 0.92, "la moderna": 0.94, schettino: 0.94,
  // Estándar (referencia).
  lala: 1.02, alpura: 1.02, bachoco: 1.0, "san juan": 1.0, bimbo: 1.04,
  wonder: 1.0, "verde valle": 1.02, morelos: 0.98, isadora: 0.98,
  nutrioli: 1.02, capullo: 1.0, zulka: 1.0, barilla: 1.14, dolores: 1.02,
  herdez: 1.02, danone: 1.02, yoplait: 1.03, chilchota: 1.0, "la villita": 1.0,
  chipilo: 1.0, gloria: 1.0, quaker: 1.04, bonafont: 1.03, ciel: 1.0,
  "e-pura": 1.0, pepsi: 1.0, mundet: 0.98, petalo: 1.0, palmolive: 1.0,
  escudo: 1.0, ace: 1.0, cloralex: 0.98, pinol: 0.98, marinela: 1.02,
  cuetara: 0.98, "santa maria": 1.02, washington: 1.02, hass: 1.0,
  "pilgrim's": 1.0, sukarne: 1.02, "el calvario": 0.98, "free range": 1.08,
  "tia rosa": 1.0, mission: 1.04, trigo: 0.95, "sello rojo": 0.95,
  nutrileche: 0.9, "1-2-3": 0.95,
  // Premium.
  "santa clara": 1.1, oroweat: 1.1, carbonell: 1.18, borges: 1.14,
  "kellogg's": 1.12, "nestle": 1.1, nescafe: 1.1, "coca-cola": 1.1,
  "sidral aga": 1.02, dove: 1.14, ariel: 1.1, clorox: 1.06, gamesa: 1.04,
  international: 1.06,
};

/** Nivel legible de una marca según su precio relativo. */
export function nivelDeMarca(factor) {
  if (factor <= 0.9) return "económica";
  if (factor >= 1.08) return "premium";
  return "estándar";
}
