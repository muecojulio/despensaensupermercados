"use client";

import ActionButton from "./ActionButton";
import { claveDispositivo, guiaInstalacion } from "../lib/dispositivo";

/**
 * Bloque “instalar en este dispositivo”: usa el aviso del navegador si lo hay
 * (Chrome y Edge en Android, Windows, Mac y Linux) y si no, explica los pasos
 * de Safari en iPad/iPhone.
 */
export default function InstruccionesInstalacion({
  dispositivo,
  puedeInstalar = false,
  estado = "idle",
  esApp = false,
  onInstalar,
  titulo = "Instalar en este dispositivo",
  descripcion = "",
}) {
  const guia = guiaInstalacion(claveDispositivo(dispositivo));

  return (
    <section className="card">
      <h2>{titulo}</h2>
      {esApp ? (
        <p className="small">
          Ya tienes Despensa MX instalada aquí: se abre en su propia ventana, sin la barra
          del navegador, y guarda tus listas en el dispositivo.
        </p>
      ) : puedeInstalar ? (
        <>
          <p className="small">
            Tu navegador ya la puede instalar. Se agrega a tus aplicaciones y abre en su
            propia ventana, también sin internet.
          </p>
          <div className="row">
            <ActionButton
              status={estado}
              loadingLabel="Abriendo instalación…"
              successLabel="Solicitud enviada"
              errorLabel="Inténtalo de nuevo"
              onClick={() => onInstalar?.()}
            >Instalar app</ActionButton>
          </div>
        </>
      ) : (
        <>
          {descripcion ? <p className="small">{descripcion}</p> : null}
          <ol className="small qr-pasos">
            {guia.pasos.map((paso) => <li key={paso}>{paso}</li>)}
          </ol>
        </>
      )}
    </section>
  );
}
