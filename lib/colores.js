/**
 * Colores por pasillo.
 *
 * Son variables CSS (no valores fijos) para que el tema oscuro las cambie sin
 * tocar el JS: cada tarjeta solo guarda `var(--cat-fruta)` en su estilo.
 */
export const COLOR_CATEGORIA = {
  lacteos: "var(--cat-lacteos)",
  despensa: "var(--cat-despensa)",
  fruta: "var(--cat-fruta)",
  carnes: "var(--cat-carnes)",
  bebidas: "var(--cat-bebidas)",
  hogar: "var(--cat-hogar)",
};

/** Franja lateral de la tarjeta: el color “puro” del pasillo. */
export const RAYA_CATEGORIA = {
  lacteos: "#3ec1e0",
  despensa: "#ffb703",
  fruta: "#7dd957",
  carnes: "#ef7d63",
  bebidas: "#ef476f",
  hogar: "#7a6cf6",
};

export function colorDe(categoria) {
  return COLOR_CATEGORIA[categoria] || "var(--cat-otro)";
}

export function rayaDe(categoria) {
  return RAYA_CATEGORIA[categoria] || "#9fb8a8";
}
