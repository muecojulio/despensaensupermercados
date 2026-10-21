"use client";

import { useState } from "react";
import Icono from "./Iconos";
import PoliticaPrivacidad from "./PoliticaPrivacidad";
import { cacheBorrarTodo } from "../lib/cache";

/**
 * Pestaña «Privacidad»: es el único lugar dentro de la app donde se muestra la
 * política. La página /privacidad sigue existiendo para enlaces directos, pero
 * usa el mismo texto (components/PoliticaPrivacidad.js).
 */
export default function PanelPrivacidad() {
  const [avisoCache, setAvisoCache] = useState("");

  async function borrarCacheApis() {
    await cacheBorrarTodo();
    setAvisoCache("Caché de APIs borrada (marcas, mapa, clima, direcciones y códigos). Tus listas no se tocaron.");
  }

  return (
    <>
      <section className="card">
        <h2>
          <Icono nombre="escudo" className="btn-icono" />
          Política de privacidad
        </h2>
        <p className="small">
          Qué se queda en tu aparato, qué sale de él y cómo borrarlo. Sin cuentas, sin
          publicidad y sin rastreo.
        </p>
        <div className="row">
          <button className="btn sec" type="button" onClick={borrarCacheApis}>
            Borrar caché de APIs de este dispositivo
          </button>
        </div>
        {avisoCache ? <p className="small" role="status" aria-live="polite">{avisoCache}</p> : null}
      </section>

      <PoliticaPrivacidad />
    </>
  );
}
