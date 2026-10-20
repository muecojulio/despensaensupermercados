"use client";

import CodigoQR from "./CodigoQR";
import Icono from "./Iconos";
import InstruccionesInstalacion from "./InstruccionesInstalacion";

/**
 * Pestaña QR: es el único lugar dentro de la app donde vive el código.
 * El QR lleva a /instalar, una página que detecta el dispositivo de quien lo
 * escanea y le muestra los pasos que le tocan (Android, iPhone, iPad o computadora).
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
        <h2 id="qr-titulo">QR para descargar e instalar</h2>
        <p className="small">
          Escanéalo con la cámara del celular, del iPad o de la computadora: abre la página
          de instalación con los pasos para ese dispositivo. Se dibuja en tu propio aparato,
          sin mandar nada a ningún servidor.
        </p>
        <CodigoQR
          valor={enlaceInstalar}
          nombreArchivo="despensa-mx-instalar.png"
          descripcion="Código QR para instalar Despensa MX"
          onAviso={onAviso}
        />
        <p className="small">
          Android con Chrome, iPhone y iPad con Safari, computadora con Chrome, Edge o Safari.
        </p>
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
    </>
  );
}
