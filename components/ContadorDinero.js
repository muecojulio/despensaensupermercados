"use client";

import { useEffect, useRef, useState } from "react";

const suavizado = (t) => 1 - (1 - t) ** 3;

/**
 * Cuenta el dinero hacia arriba (o hacia abajo) en lugar de cambiar de golpe.
 * Sin prefers-reduced-motion el número se planta directo.
 */
export default function ContadorDinero({ valor = 0, formato = (n) => n, duracion = 850 }) {
  const [mostrado, setMostrado] = useState(valor);
  const anterior = useRef(valor);
  const frame = useRef(0);

  useEffect(() => {
    const destino = Number(valor) || 0;
    const inicio = Number(anterior.current) || 0;
    anterior.current = destino;

    if (inicio === destino) return undefined;

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || typeof requestAnimationFrame !== "function") {
      setMostrado(destino);
      return undefined;
    }

    const t0 = performance.now();
    const paso = (ahora) => {
      const avance = Math.min(1, (ahora - t0) / duracion);
      setMostrado(inicio + (destino - inicio) * suavizado(avance));
      if (avance < 1) frame.current = requestAnimationFrame(paso);
    };
    frame.current = requestAnimationFrame(paso);

    return () => cancelAnimationFrame(frame.current);
  }, [valor, duracion]);

  return <>{formato(mostrado)}</>;
}
