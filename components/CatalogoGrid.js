"use client";

import { PRODUCTOS } from "../data/catalogo";
import ProductoFoto from "./ProductoFoto";
import ScrollRail from "./ScrollRail";

const COLORES = {
  lacteos: "#d7edff",
  despensa: "#ffe9c7",
  fruta: "#e3f6d4",
  carnes: "#ffd6d0",
  bebidas: "#ffd4dc",
  hogar: "#e6e4ff",
};

export default function CatalogoGrid({ onPick, marcas }) {
  return (
    <ScrollRail
      ariaLabel="Catálogo de productos"
      className="product-rail"
      viewportClassName="product-rail__viewport"
    >
      <div className="grid-prod">
        {PRODUCTOS.map((prod) => (
          <button
            key={prod.id}
            type="button"
            className="chip-prod"
            style={{ background: COLORES[prod.categoria] || "#fbfefb" }}
            aria-label={`Agregar ${prod.nombre} y elegir marca`}
            onClick={() => onPick(prod)}
          >
            <ProductoFoto producto={prod} />
            <span>
              {prod.emoji} {prod.nombre}
              {marcas?.[prod.id] ? <em className="marca-mini"> · {marcas[prod.id]}</em> : null}
            </span>
          </button>
        ))}
      </div>
    </ScrollRail>
  );
}
