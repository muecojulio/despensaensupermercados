"use client";

import Icono from "./Iconos";
import PoliticaPrivacidad from "./PoliticaPrivacidad";

/**
 * Pestaña «Privacidad»: es el único lugar dentro de la app donde se muestra la
 * política. La página /privacidad sigue existiendo para enlaces directos, pero
 * usa el mismo texto (components/PoliticaPrivacidad.js).
 */
export default function PanelPrivacidad() {
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
      </section>

      <PoliticaPrivacidad />
    </>
  );
}
