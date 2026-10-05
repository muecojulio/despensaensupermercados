"use client";

import { useEffect, useRef, useState } from "react";
import { marcasLocalesDe } from "../data/marcas";
import { buscarMarcasOff } from "../lib/openfoodfacts";
import ProductoFoto from "./ProductoFoto";
import SearchableCombobox from "./SearchableCombobox";

export default function SelectorMarca({ producto, valorInicial, onElegir, onCerrar }) {
  const locales = producto ? marcasLocalesDe(producto.id) : [];
  const [extra, setExtra] = useState([]);
  const [texto, setTexto] = useState(valorInicial || "");
  const [cargando, setCargando] = useState(false);
  const [errorMarcas, setErrorMarcas] = useState("");
  const dialogRef = useRef(null);
  const closeRef = useRef(onCerrar);
  const controlId = `marca-${String(producto?.id || "producto").replace(/[^a-zA-Z0-9_-]/g, "-")}`;
  closeRef.current = onCerrar;

  useEffect(() => {
    if (!producto) return undefined;
    let vivo = true;
    setCargando(true);
    setErrorMarcas("");

    buscarMarcasOff(producto.aliases?.[0] || producto.nombre)
      .then((lista) => {
        if (!vivo) return;
        const low = new Set(locales.map((marca) => marca.toLocaleLowerCase("es-MX")));
        setExtra((lista || []).filter((marca) => !low.has(marca.toLocaleLowerCase("es-MX"))));
      })
      .catch(() => {
        if (vivo) setErrorMarcas("No pude cargar más marcas. Puedes escribir una manualmente.");
      })
      .finally(() => vivo && setCargando(false));

    return () => {
      vivo = false;
    };
  }, [producto?.id]);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const frame = window.requestAnimationFrame(() => {
      dialogRef.current?.querySelector("input[role='combobox']")?.focus();
    });

    function trapFocus(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        closeRef.current?.();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const controls = Array.from(dialogRef.current.querySelectorAll(
        "button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])"
      )).filter((node) => !node.closest("[inert]") && node.getClientRects().length);
      if (!controls.length) return;

      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialogRef.current.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialogRef.current.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", trapFocus);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", trapFocus);
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, []);

  if (!producto) return null;

  function confirmar(marca) {
    onElegir(marca || "");
  }

  const marcas = [...new Set([...locales, ...extra])];
  const opciones = marcas.map((marca) => ({ value: marca, label: marca }));

  return (
    <div
      className="sheet-bg"
      onClick={(event) => {
        if (event.target === event.currentTarget) onCerrar();
      }}
    >
      <section
        ref={dialogRef}
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="selector-marca-titulo"
      >
        <div className="sheet-head">
          <ProductoFoto producto={producto} />
          <div>
            <h2 id="selector-marca-titulo">Elegir marca</h2>
            <div className="small">{producto.nombre}</div>
          </div>
        </div>
        <p className="small">Elige la marca que sí compras o escribe otra.</p>
        <SearchableCombobox
          id={controlId}
          label="Marca"
          value={texto}
          options={opciones}
          onChange={setTexto}
          placeholder="Ej. Nutrioli"
          freeSolo
          autoFocus
          openOnFocus={false}
          maxLength={40}
        />
        <div className="brand-status" aria-live="polite" aria-busy={cargando}>
          {cargando ? <p className="small" role="status">Buscando marcas en Open Food Facts…</p> : null}
          {!cargando && errorMarcas ? <p className="small" role="status">{errorMarcas}</p> : null}
        </div>
        <div className="row sheet-actions">
          <button className="btn" type="button" onClick={() => confirmar(texto.trim())}>
            {texto.trim() ? "Usar esta marca" : "Usar sin marca"}
          </button>
          <button className="btn sec" type="button" onClick={() => confirmar("")}>
            Sin marca
          </button>
          <button className="btn sec" type="button" onClick={onCerrar}>
            Cancelar
          </button>
        </div>
      </section>
    </div>
  );
}
