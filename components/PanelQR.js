"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { dibujarQR } from "../lib/qr";
import ActionButton from "./ActionButton";
import useActionStatus from "./useActionStatus";

const PIXELES_VISTA = 512;
const PIXELES_DESCARGA = 2048;
const NOMBRE_ARCHIVO = "despensa-mx-qr.png";

async function copiarTexto(texto) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(texto);
    return;
  }
  // Respaldo para navegadores sin portapapeles moderno.
  const area = document.createElement("textarea");
  area.value = texto;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  const copiado = document.execCommand?.("copy") ?? false;
  area.remove();
  if (!copiado) throw new Error("Sin portapapeles");
}

/**
 * Pestaña del código QR de la app: lo muestra, lo deja descargar en PNG,
 * copia o comparte el enlace y explica cómo instalarla.
 */
export default function PanelQR({ url, puedeInstalar = false, esApp = false, estadoInstalar = "idle", onInstalar, onAviso }) {
  const canvasRef = useRef(null);
  const [fallo, setFallo] = useState("");
  const [listo, setListo] = useState(false);
  const [estadoDescarga, setEstadoDescarga] = useActionStatus();
  const [estadoCopiar, setEstadoCopiar] = useActionStatus();
  const [estadoCompartir, setEstadoCompartir] = useActionStatus();

  const avisar = useCallback((texto, tipo = "success") => onAviso?.(texto, tipo), [onAviso]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !url) return;
    try {
      dibujarQR(canvas, url, { nivel: "M", pixeles: PIXELES_VISTA, pie: "Despensa MX" });
      setFallo("");
      setListo(true);
    } catch {
      setFallo("No pude dibujar el código QR.");
      setListo(false);
    }
  }, [url]);

  function imagenPNG(pixeles) {
    const lienzo = document.createElement("canvas");
    dibujarQR(lienzo, url, { nivel: "M", pixeles, pie: "Despensa MX" });
    return lienzo;
  }

  function descargar() {
    if (!url) return;
    setEstadoDescarga("loading");
    try {
      const lienzo = imagenPNG(PIXELES_DESCARGA);
      lienzo.toBlob((blob) => {
        if (!blob) {
          setEstadoDescarga("error");
          avisar("No se pudo crear la imagen. Inténtalo de nuevo.", "error");
          return;
        }
        const objetoUrl = URL.createObjectURL(blob);
        const enlace = document.createElement("a");
        enlace.href = objetoUrl;
        enlace.download = NOMBRE_ARCHIVO;
        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();
        window.setTimeout(() => URL.revokeObjectURL(objetoUrl), 4000);
        setEstadoDescarga("success");
        avisar("Descargué el QR como PNG.");
      }, "image/png");
    } catch {
      setEstadoDescarga("error");
      avisar("No se pudo descargar el QR.", "error");
    }
  }

  async function compartir() {
    if (!url) return;
    setEstadoCompartir("loading");
    try {
      if (!navigator.share) {
        await copiarTexto(url);
        setEstadoCompartir("success");
        avisar("Este navegador no comparte: copié el enlace.", "info");
        return;
      }
      let datos = { title: "Despensa MX", text: "Compara tu despensa entre súpers del Valle de México", url };
      try {
        const blob = await new Promise((resolver) => {
          imagenPNG(PIXELES_DESCARGA).toBlob(resolver, "image/png");
        });
        if (blob) {
          const archivo = new File([blob], NOMBRE_ARCHIVO, { type: "image/png" });
          if (navigator.canShare?.({ files: [archivo] })) datos = { ...datos, files: [archivo] };
        }
      } catch { /* sin imagen: se comparte solo el enlace */ }

      await navigator.share(datos);
      setEstadoCompartir("success");
      avisar("Listo, ya se compartió.");
    } catch (error) {
      if (error?.name === "AbortError") {
        setEstadoCompartir("idle");
        return;
      }
      setEstadoCompartir("error");
      avisar("No se pudo compartir. Puedes descargar el QR.", "error");
    }
  }

  async function copiar() {
    if (!url) return;
    setEstadoCopiar("loading");
    try {
      await copiarTexto(url);
      setEstadoCopiar("success");
      avisar("Copié el enlace de la app.");
    } catch {
      setEstadoCopiar("error");
      avisar("No pude copiar el enlace. Selecciónalo y cópialo a mano.", "error");
    }
  }

  return (
    <>
      <section className="card qr-box" aria-labelledby="qr-titulo">
        <h2 id="qr-titulo">Código QR de la app</h2>
        <p className="small">
          Al escanearlo se abre Despensa MX en el celular. Descárgalo para imprimirlo,
          mandarlo por WhatsApp o pegarlo donde organizas la despensa.
        </p>
        <div className="qr-marco">
          <canvas
            ref={canvasRef}
            className="qr-canvas"
            role="img"
            aria-label={url ? `Código QR para abrir ${url} en el celular` : "Código QR de Despensa MX"}
            hidden={!listo}
          />
          {!listo ? <p className="small qr-aviso">{fallo || "Preparando el código QR…"}</p> : null}
        </div>
        <p className="qr-url">{url || "—"}</p>
        <div className="row row-center qr-actions">
          <ActionButton
            status={estadoDescarga}
            loadingLabel="Creando PNG…"
            successLabel="Descargado"
            errorLabel="Reintentar"
            onClick={descargar}
          >Descargar QR (PNG)</ActionButton>
          <ActionButton
            className="btn sec"
            status={estadoCopiar}
            loadingLabel="Copiando…"
            successLabel="Enlace copiado"
            errorLabel="Reintentar"
            onClick={copiar}
          >Copiar enlace</ActionButton>
          <ActionButton
            className="btn sec"
            status={estadoCompartir}
            loadingLabel="Compartiendo…"
            successLabel="Compartido"
            errorLabel="Reintentar"
            onClick={compartir}
          >Compartir</ActionButton>
        </div>
      </section>

      <section className="card">
        <h2>Instalarla en el celular</h2>
        {esApp ? (
          <p className="small">Ya estás dentro de la app instalada. Comparte el QR para que otros la abran también.</p>
        ) : puedeInstalar ? (
          <>
            <p className="small">Instálala ahora: se agrega a tu pantalla de inicio y abre sin navegador.</p>
            <div className="row">
              <ActionButton
                status={estadoInstalar}
                loadingLabel="Abriendo instalación…"
                successLabel="Solicitud enviada"
                errorLabel="Inténtalo de nuevo"
                onClick={() => onInstalar?.()}
              >Instalar app</ActionButton>
            </div>
          </>
        ) : (
          <ol className="small qr-pasos">
            <li>Abre este enlace en el celular (o escanea el QR con la cámara).</li>
            <li>
              <b>Android / Chrome:</b> menú ⋮ → “Instalar app” o “Agregar a pantalla de inicio”.
            </li>
            <li>
              <b>iPhone / Safari:</b> botón Compartir → “Agregar a pantalla de inicio”.
            </li>
            <li>Ya instalada funciona también sin internet.</li>
          </ol>
        )}
      </section>

      <section className="card">
        <h2>Datos del código</h2>
        <p className="small">
          El QR se dibuja en tu propio celular con el enlace de esta app, así que no se manda
          nada a ningún servidor ni depende de un servicio externo para generarlo.
        </p>
      </section>
    </>
  );
}
