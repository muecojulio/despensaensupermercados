"use client";

import { descargarTexto, dibujarImagenResumen, listaOptimizadaACsv, nombreArchivoExportacion, rankingACsv } from "../lib/exportar";
import ActionButton from "./ActionButton";
import Icono from "./Iconos";
import useActionStatus from "./useActionStatus";

/**
 * Exporta el ranking de tiendas y la lista optimizada (tienda ganadora,
 * ordenada por pasillo) a CSV o a imagen PNG. Todo se genera en el
 * dispositivo; no se sube nada a ningún servidor.
 */
export default function PanelExportar({ ranking, ganadora, nombreLista, modo, marcas, onAviso }) {
  const [estadoRanking, setEstadoRanking] = useActionStatus();
  const [estadoLista, setEstadoLista] = useActionStatus();
  const [estadoImagen, setEstadoImagen] = useActionStatus();
  const [estadoCompartir, setEstadoCompartir] = useActionStatus();
  const listo = !!(ganadora && ranking?.length);

  function exportarRankingCsv() {
    if (!listo) return;
    setEstadoRanking("loading");
    try {
      descargarTexto(
        nombreArchivoExportacion(`ranking-${nombreLista}`, "csv"),
        rankingACsv(ranking, { nombreLista, modo }),
      );
      setEstadoRanking("success");
      onAviso?.("Descargué el ranking de tiendas en CSV.");
    } catch {
      setEstadoRanking("error");
      onAviso?.("No pude crear el CSV del ranking.", "error");
    }
  }

  function exportarListaCsv() {
    if (!listo) return;
    setEstadoLista("loading");
    try {
      descargarTexto(
        nombreArchivoExportacion(`lista-optimizada-${nombreLista}`, "csv"),
        listaOptimizadaACsv(ganadora, { nombreLista, modo, marcas }),
      );
      setEstadoLista("success");
      onAviso?.(`Descargué la lista optimizada de ${ganadora.tienda.nombre} en CSV.`);
    } catch {
      setEstadoLista("error");
      onAviso?.("No pude crear el CSV de la lista.", "error");
    }
  }

  function lienzo() {
    return dibujarImagenResumen({ ranking, ganadora, nombreLista, modo, marcas });
  }

  function exportarImagen() {
    if (!listo) return;
    setEstadoImagen("loading");
    try {
      lienzo().toBlob((blob) => {
        if (!blob) {
          setEstadoImagen("error");
          onAviso?.("No pude crear la imagen.", "error");
          return;
        }
        const url = URL.createObjectURL(blob);
        const enlace = document.createElement("a");
        enlace.href = url;
        enlace.download = nombreArchivoExportacion(`despensa-${nombreLista}`, "png");
        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 4000);
        setEstadoImagen("success");
        onAviso?.("Descargué el resumen como imagen PNG.");
      }, "image/png");
    } catch {
      setEstadoImagen("error");
      onAviso?.("No pude crear la imagen.", "error");
    }
  }

  async function compartirImagen() {
    if (!listo) return;
    setEstadoCompartir("loading");
    try {
      const blob = await new Promise((resolver) => lienzo().toBlob(resolver, "image/png"));
      const nombre = nombreArchivoExportacion(`despensa-${nombreLista}`, "png");
      const archivo = blob ? new File([blob], nombre, { type: "image/png" }) : null;
      if (archivo && navigator.canShare?.({ files: [archivo] })) {
        await navigator.share({ files: [archivo], title: "Despensa MX", text: `Mi despensa sale más barata en ${ganadora.tienda.nombre}: ranking y lista optimizada.` });
      } else if (navigator.share) {
        await navigator.share({ title: "Despensa MX", text: `Mi despensa sale más barata en ${ganadora.tienda.nombre} (${ganadora.total}).` });
      } else {
        exportarImagen();
        onAviso?.("Este navegador no comparte imágenes: descargué el PNG.", "info");
        setEstadoCompartir("success");
        return;
      }
      setEstadoCompartir("success");
      onAviso?.("Listo, ya se compartió la imagen.");
    } catch (error) {
      if (error?.name === "AbortError") { setEstadoCompartir("idle"); return; }
      setEstadoCompartir("error");
      onAviso?.("No se pudo compartir. Puedes descargar la imagen.", "error");
    }
  }

  return (
    <section className="card">
      <h2>Exportar ranking y lista optimizada</h2>
      <p className="small">
        La lista optimizada es la de {ganadora ? <b>{ganadora.tienda.nombre}</b> : "la tienda ganadora"},
        ordenada por pasillo y sin lo que ya tienes en casa. Se genera aquí, en tu dispositivo.
      </p>
      <div className="row">
        <ActionButton status={estadoRanking} loadingLabel="Creando CSV…" successLabel="Ranking descargado" errorLabel="Reintentar" disabled={!listo} onClick={exportarRankingCsv}>
          <Icono nombre="descarga" />Ranking (CSV)
        </ActionButton>
        <ActionButton className="btn sec" status={estadoLista} loadingLabel="Creando CSV…" successLabel="Lista descargada" errorLabel="Reintentar" disabled={!listo} onClick={exportarListaCsv}>
          <Icono nombre="descarga" />Lista optimizada (CSV)
        </ActionButton>
        <ActionButton className="btn sec" status={estadoImagen} loadingLabel="Creando imagen…" successLabel="Imagen descargada" errorLabel="Reintentar" disabled={!listo} onClick={exportarImagen}>
          <Icono nombre="descarga" />Imagen (PNG)
        </ActionButton>
        <ActionButton className="btn sec" status={estadoCompartir} loadingLabel="Compartiendo…" successLabel="Compartido" errorLabel="Reintentar" disabled={!listo} onClick={compartirImagen}>
          <Icono nombre="compartir" />Compartir imagen
        </ActionButton>
      </div>
      {!listo ? <p className="small">Sube o escribe una lista para poder exportar.</p> : null}
    </section>
  );
}
