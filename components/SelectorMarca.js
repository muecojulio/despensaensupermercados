"use client";

import { useEffect, useState } from "react";
import { marcasLocalesDe } from "../data/marcas";
import { buscarMarcasOff } from "../lib/openfoodfacts";
import ProductoFoto from "./ProductoFoto";

export default function SelectorMarca({ producto, valorInicial, onElegir, onCerrar }) {
  const locales = producto ? marcasLocalesDe(producto.id) : [];
  const [extra, setExtra] = useState([]);
  const [texto, setTexto] = useState(valorInicial || "");
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!producto) return;
    let vivo = true;
    setCargando(true);
    buscarMarcasOff(producto.aliases?.[0] || producto.nombre)
      .then((lista) => {
        if (!vivo) return;
        const low = new Set(locales.map((m) => m.toLowerCase()));
        setExtra((lista || []).filter((m) => !low.has(m.toLowerCase())));
      })
      .finally(() => vivo && setCargando(false));
    return () => {
      vivo = false;
    };
  }, [producto]);

  if (!producto) return null;

  function confirmar(marca) {
    onElegir(marca || "");
  }

  const chips = [...locales, ...extra];

  return (
    <div className="sheet-bg" role="dialog" aria-modal="true" aria-label="Elegir marca">
      <div className="sheet">
        <div className="sheet-head">
          <ProductoFoto producto={producto} />
          <div>
            <b>{producto.nombre}</b>
            <div className="small">Elige la marca que sí compras</div>
          </div>
        </div>
        <div className="chips">
          <button type="button" className={"chip" + (!texto ? " on" : "")} onClick={() => confirmar("")}>
            Sin marca
          </button>
          {chips.map((m) => (
            <button
              key={m}
              type="button"
              className={"chip" + (texto === m ? " on" : "")}
              onClick={() => confirmar(m)}
            >
              {m}
            </button>
          ))}
        </div>
        {cargando ? <p className="small">Buscando más marcas en Open Food Facts…</p> : null}
        <label>
          O escríbela
          <input
            type="text"
            value={texto}
            placeholder="Ej. Nutrioli"
            onChange={(e) => setTexto(e.target.value.slice(0, 40))}
          />
        </label>
        <div className="row">
          <button className="btn" type="button" onClick={() => confirmar(texto.trim())}>
            Usar esta marca
          </button>
          <button className="btn sec" type="button" onClick={onCerrar}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
