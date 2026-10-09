"use client";

import { useEffect, useState } from "react";

const COLORES = ["#7dd957", "#159b62", "#ffb703", "#ff8c42", "#3ec1e0", "#ef476f", "#7a6cf6"];
const PIEZAS = 18;

/**
 * Lluvia de confeti cuando aparece un ahorro nuevo.
 * Las piezas se calculan en el cliente (después de montar) para que el HTML del
 * servidor y el del navegador coincidan: en SSR no hay confeti que pintar.
 */
export default function ConfetiAhorro({ clave, activo = false, cantidad = PIEZAS }) {
  const [piezas, setPiezas] = useState([]);

  useEffect(() => {
    if (!activo) return undefined;

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return undefined;

    const nuevas = Array.from({ length: cantidad }, (_, i) => ({
      id: `${clave}-${i}`,
      izquierda: Math.random() * 100,
      deriva: (Math.random() - 0.5) * 90,
      giro: 180 + Math.random() * 540,
      espera: Math.random() * 0.5,
      duracion: 1.1 + Math.random() * 0.9,
      color: COLORES[i % COLORES.length],
      alto: 8 + Math.random() * 6,
    }));
    setPiezas(nuevas);

    const limpieza = window.setTimeout(() => setPiezas([]), 2600);
    return () => window.clearTimeout(limpieza);
  }, [clave, activo, cantidad]);

  if (!piezas.length) return null;

  return (
    <div className="confeti" aria-hidden="true">
      {piezas.map((pieza) => (
        <span
          key={pieza.id}
          style={{
            left: `${pieza.izquierda}%`,
            height: `${pieza.alto}px`,
            background: pieza.color,
            "--deriva": `${pieza.deriva}px`,
            "--giro": `${pieza.giro}deg`,
            "--espera": `${pieza.espera}s`,
            "--dur": `${pieza.duracion}s`,
          }}
        />
      ))}
    </div>
  );
}
