"use client";

import { useEffect, useState } from "react";
import CodigoQR from "./CodigoQR";
import InstruccionesInstalacion from "./InstruccionesInstalacion";
import CollapsiblePanel from "./CollapsiblePanel";
import useInstalacion from "./useInstalacion";
import { guiasCompletas, guiaInstalacion } from "../lib/dispositivo";

function FeedbackMessage({ message, type = "info" }) {
  if (!message) return null;
  const icon = type === "error" ? "!" : type === "success" ? "✓" : "i";
  return (
    <div
      className={`feedback-message feedback-${type}`}
      role={type === "error" ? "alert" : "status"}
      aria-live={type === "error" ? "assertive" : "polite"}
      aria-atomic="true"
    >
      <span className="feedback-icon" aria-hidden="true">{icon}</span>
      <span>{message}</span>
    </div>
  );
}

export default function PaginaInstalar() {
  const { puedeInstalar, esApp, dispositivo, estado, instalar } = useInstalacion();
  const [enlace, setEnlace] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [mensajeTipo, setMensajeTipo] = useState("info");
  const [abierto, setAbierto] = useState({});

  useEffect(() => {
    setEnlace(`${window.location.origin}/instalar`);
  }, []);

  function avisar(texto, tipo = "success") {
    setMensaje(texto);
    setMensajeTipo(tipo);
  }

  return (
    <div className="wrap">
      <section className="hero mini">
        <div className="hero-orbita" aria-hidden="true">
          <span>📲</span>
          <span>🚀</span>
          <span>🧺</span>
        </div>
        <div>
          <h1>Instalar Despensa MX</h1>
          <p>En el celular, en el iPad o en la computadora. Sin tiendas de apps.</p>
        </div>
      </section>

      <FeedbackMessage message={mensaje} type={mensajeTipo} />

      {!esApp && !puedeInstalar && dispositivo?.escritorio ? (
        <p className="hint">
          En la computadora también se instala: Chrome y Edge muestran el ícono de instalar
          en la barra de direcciones.
        </p>
      ) : null}

      <InstruccionesInstalacion
        dispositivo={dispositivo}
        puedeInstalar={puedeInstalar}
        estado={estado}
        esApp={esApp}
        onInstalar={instalar}
        descripcion="Sigue estos pasos y en menos de un minuto la tienes como app:"
      />

      <section className="card qr-box">
        <h2>Llévatela a otro dispositivo</h2>
        <p className="small">
          Escanea este código con la cámara del celular o del iPad (o ábrelo desde la
          computadora): lleva directo a esta página de instalación. Descárgalo para
          imprimirlo o mandarlo por WhatsApp.
        </p>
        <CodigoQR
          valor={enlace}
          nombreArchivo="despensa-mx-instalar.png"
          descripcion="Código QR para instalar Despensa MX"
          onAviso={avisar}
        />
      </section>

      <section className="card">
        <h2>Pasos en cada dispositivo</h2>
        <p className="small">Toca el que quieras para ver cómo se instala ahí.</p>
        {guiasCompletas().map((grupo) => (
          <div className="guia-grupo" key={grupo.id}>
            <button
              className="btn sec guia-toggle"
              type="button"
              aria-expanded={!!abierto[grupo.id]}
              aria-controls={`guia-${grupo.id}`}
              onClick={() => setAbierto((previo) => ({ ...previo, [grupo.id]: !previo[grupo.id] }))}
            >
              {abierto[grupo.id] ? "Ocultar" : "Ver"} · {grupo.etiqueta}
            </button>
            <CollapsiblePanel id={`guia-${grupo.id}`} open={!!abierto[grupo.id]}>
              <div className="guia-cuerpo">
                {grupo.claves.map((clave) => {
                  const guia = guiaInstalacion(clave);
                  return (
                    <div key={clave}>
                      <h3>{guia.titulo}</h3>
                      <ol className="small qr-pasos">
                        {guia.pasos.map((paso) => <li key={paso}>{paso}</li>)}
                      </ol>
                    </div>
                  );
                })}
              </div>
            </CollapsiblePanel>
          </div>
        ))}
      </section>

      <section className="card">
        <h2>Al instalarla</h2>
        <ul className="small qr-pasos qr-lista">
          <li>Se abre en su propia ventana, sin pestañas ni barra del navegador.</li>
          <li>Funciona sin internet: tus listas se quedan en tu dispositivo.</li>
          <li>No ocupa casi nada: es una app web, no se descarga de ninguna tienda.</li>
          <li>Si un día la quieres quitar, se desinstala como cualquier otra app.</li>
        </ul>
      </section>

      <section className="card">
        <div className="row">
          <a className="btn" href="/">Abrir la app</a>
          <a className="btn sec" href="/privacidad">Privacidad</a>
        </div>
      </section>
    </div>
  );
}
