"use client";

import { useRef } from "react";
import ScrollRail from "./ScrollRail";

/**
 * Grupo de chips/filtros sobre un carril horizontal nativo: scroll con momentum
 * y snap, indicadores de desbordamiento solo cuando hay contenido fuera de
 * vista, estado activo con aria-pressed y nombre accesible del grupo. Al
 * activar un chip se centra en el carril (inmediato si el usuario pide menos
 * movimiento). El carril suprime el clic que sigue a un arrastre, así recorrer
 * la fila no activa opciones por accidente.
 */
export default function ChipRail({ label, options = [], selected = {}, onToggle, className = "" }) {
  const chipRefs = useRef({});

  function handleToggle(id) {
    onToggle(id);
    window.requestAnimationFrame(() => {
      const chip = chipRefs.current[id];
      if (!chip || typeof chip.scrollIntoView !== "function") return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      chip.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "nearest", inline: "center" });
    });
  }

  return (
    <ScrollRail
      role="group"
      ariaLabel={label}
      className={["chips-rail", className].filter(Boolean).join(" ")}
      viewportClassName="chips"
    >
      {options.map((option) => {
        const on = selected[option.id] === true;
        return (
          <button
            key={option.id}
            ref={(node) => { chipRefs.current[option.id] = node; }}
            type="button"
            className={"chip" + (on ? " on" : "")}
            aria-pressed={on}
            onClick={() => handleToggle(option.id)}
          >
            {option.label}
          </button>
        );
      })}
    </ScrollRail>
  );
}
