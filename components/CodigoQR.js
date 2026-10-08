"use client";

import { useEffect, useRef, useState } from "react";
import { dibujarQR } from "../lib/qr";
import ActionButton from "./ActionButton";
import useActionStatus from "./useActionStatus";

const PIXELES_VISTA = 512;
const PIXELES_DESCARGA = 2048;

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
 * Dibuja un código QR en un canvas y lo deja descargar, copiar o compartir.
 * El QR se genera en el propio dispositivo (lib/qr.js), sin servicios externos.
 */
export default function CodigoQR({
  valor,
  nombreArchivo = "despensa-mx-qr.png",
  descripcion = "Código QR",
  onAviso,
  mostrarEnlace = true,
}) {
  const canvasRef = useRef(null);
  const [listo, setListo] = useState(false);
  const [fallo, setFallo] = useState("");
  const [estadoDescarga, setEstadoDescarga] = useActionStatus();
  const [estadoCopiar, setEstadoCopiar] = useActionStatus();
  const [estadoCompartir, setEstadoCompartir] = useActionStatus();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !valor) return;
    try {
      dibujarQR(canvas, valor, { nivel: "M", pixeles: PIXELES_VISTA, pie: "Despensa MX" });
      setFallo("");
      setListo(true);
    } catch {
      setFallo("No pude dibujar el código QR.");
      setListo(false);
    }
  }, [valor]);

  function imagenPNG(pixeles) {
    const lienzo = document.createElement("canvas");
    dibujarQR(lienzo, valor, { nivel: "M", pixeles, pie: "Despensa MX" });
    return lienzo;
  }

  function descargar() {
    if (!valor) return;
    setEstadoDescarga("loading");
    try {
      const lienzo = imagenPNG(PIXELES_DESCARGA);
      lienzo.toBlob((blob) => {
        if (!blob) {
          setEstadoDescarga("error");
          onAviso?.("No se pudo crear la imagen. Inténtalo de nuevo.", "error");
          return;
        }
        const objetoUrl = URL.createObjectURL(blob);
        const enlace = document.createElement("a");
        enlace.href = objetoUrl;
        enlace.download = nombreArchivo;
        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();
        window.setTimeout(() => URL.revokeObjectURL(objetoUrl), 4000);
        setEstadoDescarga("success");
        onAviso?.("Descargué el QR como PNG.");
      }, "image/png");
    } catch {
      setEstadoDescarga("error");
      onAviso?.("No se pudo descargar el QR.", "error");
    }
  }

  async function compartir() {
    if (!valor) return;
    setEstadoCompartir("loading");
    try {
      if (!navigator.share) {
        await copiarTexto(valor);
        setEstadoCompartir("success");
        onAviso?.("Este navegador no comparte: copié el enlace.", "info");
        return;
      }
      let datos = { title: "Despensa MX", text: "Compara tu despensa entre súpers del Valle de México", url: valor };
      try {
        const blob = await new Promise((resolver) => {
          imagenPNG(PIXELES_DESCARGA).toBlob(resolver, "image/png");
        });
        if (blob) {
          const archivo = new File([blob], nombreArchivo, { type: "image/png" });
          if (navigator.canShare?.({ files: [archivo] })) datos = { ...datos, files: [archivo] };
        }
      } catch { /* sin imagen: se comparte solo el enlace */ }

      await navigator.share(datos);
      setEstadoCompartir("success");
      onAviso?.("Listo, ya se compartió.");
    } catch (error) {
      if (error?.name === "AbortError") {
        setEstadoCompartir("idle");
        return;
      }
      setEstadoCompartir("error");
      onAviso?.("No se pudo compartir. Puedes descargar el QR.", "error");
    }
  }

  async function copiar() {
    if (!valor) return;
    setEstadoCopiar("loading");
    try {
      await copiarTexto(valor);
      setEstadoCopiar("success");
      onAviso?.("Copié el enlace de instalación.");
    } catch {
      setEstadoCopiar("error");
      onAviso?.("No pude copiar el enlace. Selecciónalo y cópialo a mano.", "error");
    }
  }

  return (
    <>
      <div className="qr-marco">
        <canvas
          ref={canvasRef}
          className="qr-canvas"
          role="img"
          aria-label={valor ? `${descripcion}: abre ${valor}` : descripcion}
          hidden={!listo}
        />
        {!listo ? <p className="small qr-aviso">{fallo || "Preparando el código QR…"}</p> : null}
      </div>
      {mostrarEnlace && valor ? <p className="qr-url">{valor}</p> : null}
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
    </>
  );
}
