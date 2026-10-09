"use client";

import CodigoQR from "./CodigoQR";
import Icono from "./Iconos";
import InstruccionesInstalacion from "./InstruccionesInstalacion";

/**
 * Pestaña QR: el código lleva a la página de instalación, así que sirve igual
 * para el celular, el iPad o la computadora de quien lo escanee.
 */
export default function PanelQR({
  url,
  dispositivo,
  puedeInstalar = false,
  estadoInstalar = "idle",
  esApp = false,
  onInstalar,
  onAviso,
}) {
  const enlaceInstalar = url ? `${url}/instalar` : "";

  return (
    <>
      <section className="card qr-box" aria-labelledby="qr-titulo">
        <h2 id="qr-titulo">QR para instalar la app</h2>
        <p className="small">
          Al escanearlo se abre la página de instalación: ahí salen los pasos para ese
          dispositivo, sea celular Android, iPhone, iPad o computadora. Descárgalo para
          imprimirlo o mandarlo por WhatsApp.
        </p>
        <CodigoQR
          valor={enlaceInstalar}
          nombreArchivo="despensa-mx-instalar.png"
          descripcion="Código QR para instalar Despensa MX"
          onAviso={onAviso}
        />
        <div className="row row-center">
          <a className="btn sec" href="/instalar"><Icono nombre="instalar" />Abrir página de instalación</a>
        </div>
      </section>

      <InstruccionesInstalacion
        dispositivo={dispositivo}
        puedeInstalar={puedeInstalar}
        estado={estadoInstalar}
        esApp={esApp}
        onInstalar={onInstalar}
        titulo="Instalarla aquí mismo"
        descripcion="Si estás viendo esto en el dispositivo donde la quieres, estos son los pasos:"
      />

      <section className="card">
        <h2>Datos del código</h2>
        <p className="small">
          El QR apunta a {enlaceInstalar || "la página de instalación"} y se dibuja en tu
          propio dispositivo, sin mandar nada a ningún servidor.
        </p>
      </section>
    </>
  );
}
