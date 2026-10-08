"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PRODUCTOS, TIENDAS } from "../data/catalogo";
import { BASICOS, ZONAS } from "../data/zonas";
import { NOMBRE_PASILLO, ORDEN_PASILLO, PESO_KG, RECETAS, SUSTITUTOS, avisoDiaCompra } from "../data/compras";
import { agregarOSumarProducto, borrarLineaEnTexto, cambiarCantidadEnTexto, comparar, emparejar, parsearLista } from "../lib/despensa";
import { leerCualquierArchivo } from "../lib/archivos";
import { comprimirImagen } from "../lib/imagen";
import { buscarSupersCercanos } from "../lib/geo";
import { detectarDispositivo } from "../lib/dispositivo";
import ProductoFoto from "./ProductoFoto";
import MapaCercanos from "./MapaCercanos";
import SelectorMarca from "./SelectorMarca";
import CatalogoGrid from "./CatalogoGrid";
import ActionButton from "./ActionButton";
import SearchableCombobox from "./SearchableCombobox";
import TabBar, { APP_TABS } from "./TabBar";
import SwipeTabPanel from "./SwipeTabPanel";
import PanelQR from "./PanelQR";
import CollapsiblePanel from "./CollapsiblePanel";
import Switch from "./Switch";
import ChipRail from "./ChipRail";
import SwipeRevealCard from "./SwipeRevealCard";
import useActionStatus from "./useActionStatus";

const K = {
  listas: "despensa-mx-listas",
  tiendas: "despensa-mx-tiendas",
  zona: "despensa-mx-zona",
  presu: "despensa-mx-presupuesto",
  hist: "despensa-mx-historial",
  ofertas: "despensa-mx-ofertas",
  marcas: "despensa-mx-marcas",
  alacena: "despensa-mx-alacena",
  antojo: "despensa-mx-antojos",
  demo: "despensa-mx-sin-precarga",
  partida: "despensa-mx-partida",
};
const DEMO = "2 leche\n1 huevo 12\n1 Coca-Cola\n1 kg tortillas\n1 arroz\n1 frijol\n1 aceite\n1 jitomate\n1 pollo";
const COLORES = { lacteos: "#d7edff", despensa: "#ffe9c7", fruta: "#e3f6d4", carnes: "#ffd6d0", bebidas: "#ffd4dc", hogar: "#e6e4ff" };
const money = (n) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n || 0);
const save = (k, v) => { try { localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v)); } catch {} };
const load = (k) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch { return null; } };

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

export default function AppClient() {
  const fileRef = useRef(null);
  const fotoRef = useRef(null);
  const fileLockRef = useRef(false);
  const fotoLockRef = useRef(false);
  const cercaLockRef = useRef(false);
  const panelTimerRef = useRef(null);
  const [estadoArchivo, setEstadoArchivo] = useActionStatus();
  const [estadoFoto, setEstadoFoto] = useActionStatus();
  const [estadoCerca, setEstadoCerca] = useActionStatus();
  const [estadoInstalar, setEstadoInstalar] = useActionStatus();
  const [estadoOferta, setEstadoOferta] = useActionStatus();
  const [estadoLista, setEstadoLista] = useActionStatus();

  const [texto, setTexto] = useState("");
  const [nombreLista, setNombreLista] = useState("Despensa semanal");
  const [guardadas, setGuardadas] = useState([]);
  const [origen, setOrigen] = useState("");
  const [promptInstall, setPromptInstall] = useState(null);
  const [showInstall, setShowInstall] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [mensajeTipo, setMensajeTipo] = useState("info");
  const [arrastrando, setArrastrando] = useState(false);
  const [verCatalogo, setVerCatalogo] = useState(false);
  const [verTiendas, setVerTiendas] = useState(false);
  const [marcados, setMarcados] = useState({});
  const [tiendasOn, setTiendasOn] = useState(() => Object.fromEntries(TIENDAS.map((t) => [t.id, true])));
  const [zona, setZona] = useState("Coyoacán");
  const [presupuesto, setPresupuesto] = useState("");
  const [historial, setHistorial] = useState([]);
  const [ofertas, setOfertas] = useState([]);
  const [fotoMsg, setFotoMsg] = useState("");
  const [ofertaProd, setOfertaProd] = useState(PRODUCTOS[0].id);
  const [ofertaTienda, setOfertaTienda] = useState(TIENDAS[2].id);
  const [ofertaPrecio, setOfertaPrecio] = useState("");
  const [alacena, setAlacena] = useState({});
  const [soloOferta, setSoloOferta] = useState({});
  const [marcas, setMarcas] = useState({});
  const [avisoDia] = useState(() => avisoDiaCompra());
  const [antojos, setAntojos] = useState({});
  const [pestana, setPestana] = useState("inicio");
  const [panelAnterior, setPanelAnterior] = useState(null);
  const [direccionPanel, setDireccionPanel] = useState("forward");
  const [cercaMsg, setCercaMsg] = useState("");
  const [cercaMsgTipo, setCercaMsgTipo] = useState("info");
  const [cercanos, setCercanos] = useState([]);
  const [miUbicacion, setMiUbicacion] = useState(null);
  const [sucursal, setSucursal] = useState(null);
  const [demoActiva, setDemoActiva] = useState(false);
  const [partidaTexto, setPartidaTexto] = useState("");
  const [partidaModo, setPartidaModo] = useState("zona");
  const [esApp, setEsApp] = useState(false);
  const [dispositivo, setDispositivo] = useState(null);
  const [picker, setPicker] = useState(null);

  useEffect(() => {
    try {
      const g = load(K.listas); if (g) setGuardadas(g);
      const t = load(K.tiendas); if (t) setTiendasOn({ ...Object.fromEntries(TIENDAS.map((x) => [x.id, true])), ...t });
      const z = localStorage.getItem(K.zona); if (z) setZona(z);
      const pr = localStorage.getItem(K.presu); if (pr) setPresupuesto(pr);
      const hi = load(K.hist); if (hi) setHistorial(hi);
      const of = load(K.ofertas); if (of) setOfertas(of);
      const ma = load(K.marcas); if (ma) setMarcas(ma);
      const al = load(K.alacena); if (al) setAlacena(al);
      const an = load(K.antojo); if (an) setAntojos(an);
      const pa = load(K.partida); if (pa) { if (pa.texto) setPartidaTexto(pa.texto); if (pa.modo) setPartidaModo(pa.modo); }
      const instalada = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
      setEsApp(!!instalada);
      setDispositivo(detectarDispositivo());
      if (localStorage.getItem(K.demo) !== "1") {
        setTexto(DEMO);
        setNombreLista("Ejemplo para ver cómo funciona");
        setPestana("resultado");
        setDemoActiva(true);
        setAntojos({ "linea-2": true });
        setMensaje("Esto es una precarga de ejemplo. Puedes quitarla con el botón.");
        setMensajeTipo("info");
      }
    } catch {}
    setOrigen(window.location.origin);
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
    const onPrompt = (e) => { e.preventDefault(); setPromptInstall(e); setShowInstall(true); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      if (panelTimerRef.current) window.clearTimeout(panelTimerRef.current);
    };
  }, []);

  const items = useMemo(() => parsearLista(texto), [texto]);
  const activas = useMemo(() => TIENDAS.filter((t) => tiendasOn[t.id] !== false), [tiendasOn]);
  const ranking = useMemo(() => comparar(items, activas.length ? activas : TIENDAS, ofertas, { skipIds: alacena, maxPorItem: soloOferta, antojoIds: antojos }), [items, activas, ofertas, alacena, soloOferta, antojos]);
  const ganadora = ranking[0];
  const masCara = ranking[ranking.length - 1];
  const ahorro = ganadora && masCara ? Math.max(0, masCara.total - ganadora.total) : 0;
  const noReconocidos = useMemo(() => items.filter((it) => !emparejar(it).producto), [items]);
  const pesoKg = useMemo(() => items.reduce((acc, item) => alacena[item.id] ? acc : acc + ((emparejar(item).producto ? PESO_KG[emparejar(item).producto.id] || 0.4 : 0.4) * item.cantidad), 0), [items, alacena]);
  const itemsPasillo = useMemo(() => [...items].sort((a, b) => (ORDEN_PASILLO[emparejar(a).producto?.categoria] || 9) - (ORDEN_PASILLO[emparejar(b).producto?.categoria] || 9)), [items]);
  const tope = Number(presupuesto) || 0;
  const baseGanadora = ganadora?.totalBase ?? ganadora?.total ?? 0;
  const antojoGanadora = ganadora?.totalAntojo ?? 0;
  const hechos = items.filter((it) => marcados[it.id]).length;
  const faltanBasicos = BASICOS.filter((b) => !items.some((it) => it.nombre.toLowerCase().includes(b.split(" ")[0])));

  function notificar(text, type = "success") {
    setMensaje(text);
    setMensajeTipo(type);
  }

  function cambiarPestana(siguiente) {
    if (!APP_TABS.some((tab) => tab.id === siguiente)) return;

    if (siguiente !== pestana) {
      const indexActual = APP_TABS.findIndex((tab) => tab.id === pestana);
      const indexSiguiente = APP_TABS.findIndex((tab) => tab.id === siguiente);
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (panelTimerRef.current) window.clearTimeout(panelTimerRef.current);
      setDireccionPanel(indexSiguiente >= indexActual ? "forward" : "backward");
      if (reduced) {
        setPanelAnterior(null);
      } else {
        setPanelAnterior(pestana);
        panelTimerRef.current = window.setTimeout(() => {
          setPanelAnterior(null);
          panelTimerRef.current = null;
        }, 250);
      }
      setPestana(siguiente);
    }

    if (siguiente === "cerca" && !cercanos.length && !cercaLockRef.current) buscarCerca();
  }

  function irApp(extra) {
    if (extra === "archivo") {
      cambiarPestana("subir");
      setTimeout(() => fileRef.current?.click(), 200);
      return;
    }
    if (extra === "foto") {
      cambiarPestana("subir");
      setTimeout(() => fotoRef.current?.click(), 200);
      return;
    }
    if (extra === "catalogo") {
      setVerCatalogo(true);
      cambiarPestana("lista");
      return;
    }
    cambiarPestana("subir");
  }

  function quitarPrecarga() {
    setTexto("");
    setNombreLista("Despensa semanal");
    setMarcados({});
    setAlacena({});
    setSoloOferta({});
    setAntojos({});
    setSucursal(null);
    setDemoActiva(false);
    cambiarPestana("subir");
    save(K.demo, "1");
    notificar("Quité la precarga.");
  }

  function verPrecarga() {
    setTexto(DEMO);
    setNombreLista("Ejemplo para ver cómo funciona");
    cambiarPestana("resultado");
    setDemoActiva(true);
    setAntojos({ "linea-2": true });
    localStorage.removeItem(K.demo);
    notificar("Volvió el ejemplo.", "info");
  }

  function guardarMarca(id, marca) {
    const next = { ...marcas };
    if (marca) next[id] = marca;
    else delete next[id];
    setMarcas(next);
    save(K.marcas, next);
  }

  function agregarProducto(prod, marca) {
    setTexto((previous) => agregarOSumarProducto(previous, prod.aliases[0] || prod.nombre));
    if (marca) guardarMarca(prod.id, marca);
    notificar(marca ? `Agregué ${prod.nombre} · ${marca}.` : `Agregué ${prod.nombre}.`);
  }

  async function procesarArchivo(file) {
    if (!file || fileLockRef.current) return;
    fileLockRef.current = true;
    setEstadoArchivo("loading");

    try {
      const { texto: content, aviso } = await leerCualquierArchivo(file);
      setTexto(content);
      setNombreLista(file.name.replace(/\.[^.]+$/, ""));
      setMarcados({});
      notificar((aviso || "Archivo listo.") + " Abajo está la tienda más barata.");
      setEstadoArchivo("success");
      setTimeout(() => cambiarPestana("resultado"), 80);
    } catch (err) {
      const error = err.message || "No pude leer ese archivo.";
      notificar(error, "error");
      setEstadoArchivo("error");
    } finally {
      fileLockRef.current = false;
    }
  }

  function origenMaps() {
    if (partidaModo === "gps" && miUbicacion) return miUbicacion.lat + "," + miUbicacion.lon;
    if (partidaModo === "manual" && partidaTexto.trim()) return partidaTexto.trim() + " México";
    return zona + " México";
  }

  const mapaUrl = (n) => "https://www.google.com/maps/dir/?api=1&origin=" + encodeURIComponent(origenMaps()) + "&destination=" + encodeURIComponent(n + " " + zona + " México");
  const rumboUrl = (lat, lon) => "https://www.google.com/maps/dir/?api=1&origin=" + encodeURIComponent(origenMaps()) + "&destination=" + lat + "," + lon;

  function buscarCerca() {
    if (cercaLockRef.current) return;
    if (!navigator.geolocation) {
      setCercaMsg("Este celular no da ubicación.");
      setCercaMsgTipo("error");
      setEstadoCerca("error");
      return;
    }

    cercaLockRef.current = true;
    setCercaMsg("Pidiendo tu ubicación…");
    setCercaMsgTipo("info");
    setEstadoCerca("loading");

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      setMiUbicacion({ lat, lon });
      try {
        const lista = await buscarSupersCercanos(lat, lon);
        setCercanos(lista);
        setCercaMsg(lista.length ? "Estos te quedan más cerca:" : "No encontré súpers cerca.");
        setCercaMsgTipo(lista.length ? "success" : "info");
        setEstadoCerca("success");
      } catch (err) {
        setCercaMsg(err.message || "No pude buscar ahora.");
        setCercaMsgTipo("error");
        setEstadoCerca("error");
      } finally {
        cercaLockRef.current = false;
      }
    }, () => {
      setCercaMsg("No autorizaste la ubicación.");
      setCercaMsgTipo("error");
      setEstadoCerca("error");
      cercaLockRef.current = false;
    }, { enableHighAccuracy: true, timeout: 12000 });
  }

  async function leerFoto(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || fotoLockRef.current) return;
    fotoLockRef.current = true;
    setEstadoFoto("loading");
    setFotoMsg("Preparando la foto…");

    try {
      const imagen = await comprimirImagen(file);
      setFotoMsg("Leyendo la foto…");
      const response = await fetch("/api/lista-foto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagen }),
      });
      let data = {};
      try { data = await response.json(); } catch { data = {}; }
      if (!response.ok) {
        if (response.status === 413) throw new Error("La foto es muy pesada. Toma otra más cerca.");
        throw new Error(data.error || "No pude leer la foto.");
      }

      setTexto(data.texto);
      setFotoMsg("");
      notificar("Foto leída. Revisa la lista y el resultado.");
      setEstadoFoto("success");
      cambiarPestana("resultado");
    } catch (error) {
      const message = error.message || "No se pudo enviar la foto.";
      setFotoMsg(message);
      notificar(message, "error");
      setEstadoFoto("error");
    } finally {
      fotoLockRef.current = false;
    }
  }

  async function instalarApp() {
    if (!promptInstall) return;
    setEstadoInstalar("loading");
    try {
      promptInstall.prompt();
      await promptInstall.userChoice;
      setPromptInstall(null);
      setShowInstall(false);
      setEstadoInstalar("success");
      notificar("Solicitud de instalación enviada.");
    } catch {
      setEstadoInstalar("error");
      notificar("No se pudo iniciar la instalación. Inténtalo de nuevo desde el menú del navegador.", "error");
    }
  }

  const mostrarPanel = (id) => pestana === id || panelAnterior === id;

  return (
    <div className={"wrap compacto" + (esApp ? " app-mode" : "")}>
      <section className="hero mini">
        <div><h1>Despensa MX</h1><p>Todo junto, en la tienda más barata.</p></div>
        <div className="row">
          {demoActiva ? <button className="btn danger" type="button" onClick={quitarPrecarga}>Quitar precarga</button> : <button className="btn sec" type="button" onClick={verPrecarga}>Ver ejemplo</button>}
        </div>
      </section>
      <FeedbackMessage message={mensaje} type={mensajeTipo} />
      <p className="hint">Precios de referencia, no del anaquel de hoy.</p>
      {avisoDia ? <p className="aviso">{avisoDia}</p> : null}
      {items.length ? <p className="hint">Peso estimado: {pesoKg.toFixed(1)} kg.</p> : null}

      <div className="tab-panels">
        <SwipeTabPanel
          id="inicio"
          labelledBy="tab-inicio"
          active={pestana === "inicio"}
          exiting={panelAnterior === "inicio" && pestana !== "inicio"}
          direction={direccionPanel}
          onSwipe={(direction) => cambiarPestana(direction === "next" ? "subir" : "inicio")}
        >
          {mostrarPanel("inicio") ? (
            <section className="card">
              <h2>Empieza aquí</h2>
              <p className="small">Sube tu lista. En segundos te digo en qué súper del Valle de México sale más barato comprar todo junto.</p>
              <div className="home-actions">
                <button className="btn home-btn" type="button" onClick={() => irApp("archivo")}>Subir archivo de despensa</button>
                <button className="btn sec home-btn" type="button" onClick={() => irApp()}>Escribir la lista a mano</button>
                <ActionButton
                  className="btn sec home-btn"
                  status={estadoFoto}
                  loadingLabel="Leyendo foto…"
                  successLabel="Foto leída"
                  errorLabel="Reintentar foto"
                  onClick={() => irApp("foto")}
                >Foto de la lista</ActionButton>
                <button className="btn sec home-btn" type="button" onClick={() => irApp("catalogo")}>Ver catálogo</button>
                <a className="btn sec home-btn" href="/instalar">Instalar la app</a>
                <button className="btn sec home-btn" type="button" onClick={verPrecarga}>Ver ejemplo precargado</button>
              </div>
              <p className="hint">Precios de referencia para CDMX y zona conurbada.</p>
            </section>
          ) : null}
        </SwipeTabPanel>

        <SwipeTabPanel
          id="subir"
          labelledBy="tab-subir"
          active={pestana === "subir"}
          exiting={panelAnterior === "subir" && pestana !== "subir"}
          direction={direccionPanel}
          onSwipe={(direction) => cambiarPestana(direction === "next" ? "resultado" : "inicio")}
        >
          {mostrarPanel("subir") ? (
            <section className="card">
              <h2>1. Sube tu despensa</h2>
              <div
                className={"drop" + (arrastrando ? " on" : "")}
                role="group"
                aria-label="Carga de lista"
                aria-busy={estadoArchivo === "loading" || estadoFoto === "loading"}
                onDragOver={(event) => { event.preventDefault(); setArrastrando(true); }}
                onDragLeave={() => setArrastrando(false)}
                onDrop={(event) => { event.preventDefault(); setArrastrando(false); procesarArchivo(event.dataTransfer.files?.[0]); }}
              >
                <b>Arrastra tu lista aquí</b>
                <p className="small">.txt o .csv. Si la tienes en Excel: Archivo → Guardar como → CSV.</p>
                <div className="row row-center">
                  <a className="btn sec" href="/ejemplo-despensa.txt" download>Ejemplo .txt</a>
                  <a className="btn sec" href="/ejemplo-despensa.csv" download>Ejemplo CSV</a>
                </div>
                <div className="row row-center upload-actions">
                  <ActionButton
                    className="btn"
                    status={estadoArchivo}
                    loadingLabel="Leyendo archivo…"
                    successLabel="Archivo listo"
                    errorLabel="Reintentar archivo"
                    onClick={() => fileRef.current?.click()}
                  >Elegir archivo</ActionButton>
                  <ActionButton
                    className="btn sec"
                    status={estadoFoto}
                    loadingLabel="Leyendo foto…"
                    successLabel="Foto leída"
                    errorLabel="Reintentar foto"
                    onClick={() => fotoRef.current?.click()}
                  >Foto de la lista</ActionButton>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  hidden
                  aria-label="Seleccionar archivo .txt o .csv de despensa"
                  disabled={estadoArchivo === "loading"}
                  onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; procesarArchivo(file); }}
                />
                <input
                  ref={fotoRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  hidden
                  aria-label="Seleccionar o tomar una foto de la lista"
                  disabled={estadoFoto === "loading"}
                  onChange={leerFoto}
                />
                {fotoMsg ? <p className="small action-message" role={estadoFoto === "loading" ? "status" : undefined} aria-live={estadoFoto === "loading" ? "polite" : "off"}>{fotoMsg}</p> : null}
              </div>
              <div className="form-grid location-fields">
                <label className="field-label" htmlFor="zona">Tu alcaldía
                  <select id="zona" value={zona} onChange={(event) => { setZona(event.target.value); save(K.zona, event.target.value); }}>
                    {ZONAS.map((z) => <option key={z} value={z}>{z}</option>)}
                  </select>
                </label>
                <label className="field-label" htmlFor="presupuesto">Presupuesto tope
                  <input id="presupuesto" type="number" min="0" inputMode="decimal" placeholder="1200" value={presupuesto} onChange={(event) => { setPresupuesto(event.target.value); save(K.presu, event.target.value); }} />
                </label>
              </div>
            </section>
          ) : null}
        </SwipeTabPanel>

        <SwipeTabPanel
          id="resultado"
          labelledBy="tab-resultado"
          active={pestana === "resultado"}
          exiting={panelAnterior === "resultado" && pestana !== "resultado"}
          direction={direccionPanel}
          onSwipe={(direction) => cambiarPestana(direction === "next" ? "lista" : "subir")}
        >
          {mostrarPanel("resultado") ? (
            <>
              <section className="card winner" id="resultado">
                <h2>2. Dónde sale más barato comprar TODO junto</h2>
                {!items.length || !ganadora ? <p className="small">Sube el archivo y aquí aparece la tienda ganadora.</p> : (
                  <>
                    <div className="resumen"><div>1. {sucursal ? sucursal.nombre : ganadora.tienda.nombre}</div><div>2. Total: {money(ganadora.total)}</div><div>3. Ahorro vs la más cara: {money(ahorro)}</div></div>
                    {noReconocidos.length ? <p className="faltante">No reconocí: {noReconocidos.map((x) => x.nombre).join(", ")}.</p> : <p className="ok">Reconocí todos los renglones.</p>}
                    <p className="precio grande">{money(ganadora.total)}</p>
                    <p className="small">Despensa: {money(baseGanadora)}{antojoGanadora > 0 ? " · Antojos: " + money(antojoGanadora) : ""}</p>
                    {tope > 0 && baseGanadora > tope ? <p className="faltante">Se pasa del tope de {money(tope)}.</p> : null}
                    <div className="row">
                      <button className="btn" type="button" onClick={() => {
                        const lineas = ["Despensa: " + nombreLista, "Más barato: " + ganadora.tienda.nombre + " " + money(ganadora.total), ""].concat(ganadora.detalle.map((d) => "• " + d.cantidad + " × " + (d.producto ? d.producto.nombre : d.nombre)));
                        window.open("https://wa.me/?text=" + encodeURIComponent(lineas.join("\n")), "_blank");
                      }}>WhatsApp</button>
                      <a className="btn sec" href={mapaUrl(ganadora.tienda.nombre)} target="_blank" rel="noreferrer">Mapa</a>
                      <button className="btn sec" type="button" onClick={() => { const next = [{ id: Date.now().toString(), fecha: new Date().toLocaleString("es-MX"), tienda: ganadora.tienda.nombre, total: ganadora.total, zona, nombre: nombreLista }, ...historial].slice(0, 20); setHistorial(next); save(K.hist, next); notificar("Historial guardado."); }}>Historial</button>
                    </div>
                    {ganadora.detalle.map((d) => (
                      <div className="ticket-line" key={d.id}>
                        <ProductoFoto producto={d.producto} />
                        <div className="item-info"><b>{d.cantidad} × {d.producto ? d.producto.nombre : d.nombre}{d.producto && marcas[d.producto.id] ? " · " + marcas[d.producto.id] : ""}</b></div>
                        <div className="precio">{d.subtotal != null ? money(d.subtotal) : "—"}</div>
                      </div>
                    ))}
                  </>
                )}
              </section>
              <section className="card">
                <h2>Comparación</h2>
                {[...ranking].sort((a, b) => a.total - b.total).map((r, i) => (
                  <div className="tienda" key={r.tienda.id}><div><b>{i + 1}. {r.tienda.nombre}</b>{i === 0 ? <span className="tag">más barata</span> : null}</div><div className="precio">{money(r.total)}</div></div>
                ))}
              </section>
            </>
          ) : null}
        </SwipeTabPanel>

        <SwipeTabPanel
          id="lista"
          labelledBy="tab-lista"
          active={pestana === "lista"}
          exiting={panelAnterior === "lista" && pestana !== "lista"}
          direction={direccionPanel}
          onSwipe={(direction) => cambiarPestana(direction === "next" ? "cerca" : "resultado")}
        >
          {mostrarPanel("lista") ? (
            <>
              <section className="card">
                <h2>Toca para agregar (y elegir marca)</h2>
                <p className="small">Al tocar un producto se abre el selector de marca.</p>
                <CatalogoGrid marcas={marcas} onPick={(prod) => setPicker({ modo: "agregar", producto: prod })} />
              </section>
              <section className="card">
                <h2>Para llevar al súper {items.length ? `(${hechos}/${items.length})` : ""}</h2>
                {itemsPasillo.map((item) => {
                  const indice = items.findIndex((x) => x.id === item.id);
                  const producto = emparejar(item).producto;
                  const cat = producto?.categoria || "despensa";
                  const estaMarcado = !!marcados[item.id];
                  return (
                    <SwipeRevealCard
                      key={item.id}
                      nombre={producto ? producto.nombre : item.nombre}
                      onQuitar={() => setTexto((previous) => borrarLineaEnTexto(previous, indice))}
                    >
                      <div className={"item-card" + (estaMarcado ? " hecho" : "") + (antojos[item.id] ? " antojo" : "")} style={{ background: antojos[item.id] ? "#ffe8f0" : COLORES[cat] }}>
                        <label className="check">
                          <input
                            type="checkbox"
                            checked={estaMarcado}
                            aria-label={`${estaMarcado ? "Marcar como pendiente" : "Marcar como comprado"}: ${item.nombre}`}
                            onChange={() => setMarcados((current) => ({ ...current, [item.id]: !current[item.id] }))}
                          />
                        </label>
                        <button type="button" className="foto-tap" aria-label={`Cambiar marca de ${item.nombre}`} onClick={() => producto && setPicker({ modo: "linea", producto })}>
                          <ProductoFoto producto={producto} />
                        </button>
                        <div className="item-info">
                          <button type="button" className="nombre-tap" onClick={() => producto && setPicker({ modo: "linea", producto })}>
                            <b>{producto ? producto.nombre : item.nombre}</b>
                          </button>
                          <div className="small">{NOMBRE_PASILLO[cat] || "Otros"} · {item.cantidad}{marcas[producto?.id] ? " · Marca: " + marcas[producto.id] : ""}</div>
                          {producto && SUSTITUTOS[producto.id] ? <div className="small">{SUSTITUTOS[producto.id]}</div> : null}
                          <Switch
                            id={`alacena-${item.id}`}
                            label="Ya está en casa"
                            checked={!!alacena[item.id]}
                            onChange={(value) => { const next = { ...alacena, [item.id]: value }; setAlacena(next); save(K.alacena, next); }}
                          />
                          <Switch
                            id={`antojo-${item.id}`}
                            label="Antojo"
                            checked={!!antojos[item.id]}
                            onChange={(value) => { const next = { ...antojos, [item.id]: value }; setAntojos(next); save(K.antojo, next); }}
                          />
                        </div>
                        <div className="qty">
                          <button type="button" aria-label={`Disminuir cantidad de ${item.nombre}`} onClick={() => setTexto((previous) => cambiarCantidadEnTexto(previous, indice, Math.max(1, item.cantidad - 1)))}>−</button>
                          <input type="number" min="1" inputMode="numeric" aria-label={`Cantidad de ${item.nombre}`} value={item.cantidad} onChange={(event) => setTexto((previous) => cambiarCantidadEnTexto(previous, indice, Math.max(1, Number(event.target.value) || 1)))} />
                          <button type="button" aria-label={`Aumentar cantidad de ${item.nombre}`} onClick={() => setTexto((previous) => cambiarCantidadEnTexto(previous, indice, item.cantidad + 1))}>+</button>
                        </div>
                        <button className="btn-x" type="button" aria-label={`Quitar ${item.nombre} de la lista`} onClick={() => setTexto((previous) => borrarLineaEnTexto(previous, indice))}>✕</button>
                      </div>
                    </SwipeRevealCard>
                  );
                })}
              </section>
            </>
          ) : null}
        </SwipeTabPanel>

        <SwipeTabPanel
          id="cerca"
          labelledBy="tab-cerca"
          active={pestana === "cerca"}
          exiting={panelAnterior === "cerca" && pestana !== "cerca"}
          direction={direccionPanel}
          onSwipe={(direction) => cambiarPestana(direction === "next" ? "mas" : "lista")}
        >
          {mostrarPanel("cerca") ? (
            <section className="card">
              <h2>Súpers cerca de ti</h2>
              <label className="field-label" htmlFor="punto-partida">Punto de partida</label>
              <input id="punto-partida" type="text" autoComplete="street-address" placeholder="Colonia, calle o alcaldía" value={partidaTexto} onChange={(event) => setPartidaTexto(event.target.value)} />
              <div className="row">
                <button className="btn" type="button" onClick={() => {
                  if (!partidaTexto.trim()) {
                    setCercaMsg("Escribe una dirección.");
                    setCercaMsgTipo("error");
                    return;
                  }
                  setPartidaModo("manual");
                  save(K.partida, { modo: "manual", texto: partidaTexto });
                  setCercaMsg("Sales desde: " + partidaTexto);
                  setCercaMsgTipo("success");
                }}>Usar este punto</button>
                <ActionButton
                  className="btn sec"
                  status={estadoCerca}
                  loadingLabel="Buscando cerca…"
                  successLabel="Búsqueda lista"
                  errorLabel="Reintentar búsqueda"
                  onClick={buscarCerca}
                >Buscar cerca</ActionButton>
              </div>
              {cercaMsg ? <p className={`small status-message status-${cercaMsgTipo}`} role={cercaMsgTipo === "error" ? "alert" : "status"} aria-live={cercaMsgTipo === "error" ? "assertive" : "polite"} aria-busy={estadoCerca === "loading"}>{cercaMsg}</p> : null}
              {miUbicacion ? <MapaCercanos yo={miUbicacion} puntos={cercanos} /> : null}
              {cercanos.map((store) => (
                <div className="tienda" key={store.id}>
                  <div><b>{store.nombre}</b><div className="small">{store.km} km</div></div>
                  <div className="row">
                    <button className="btn sec" type="button" onClick={() => { setSucursal(store); cambiarPestana("resultado"); }}>Usar esta</button>
                    <a className="btn sec" href={rumboUrl(store.lat, store.lon)} target="_blank" rel="noreferrer">Cómo llegar</a>
                  </div>
                </div>
              ))}
            </section>
          ) : null}
        </SwipeTabPanel>

        <SwipeTabPanel
          id="mas"
          labelledBy="tab-mas"
          active={pestana === "mas"}
          exiting={panelAnterior === "mas" && pestana !== "mas"}
          direction={direccionPanel}
          onSwipe={(direction) => cambiarPestana(direction === "next" ? "qr" : "cerca")}
        >
          {mostrarPanel("mas") ? (
            <>
              <section className="card">
                <h2>Si vas a cocinar esto</h2>
                <div className="row">{RECETAS.map((recipe) => <button key={recipe.id} className="btn sec" type="button" onClick={() => { let nextText = texto; recipe.items.forEach((name) => { nextText = agregarOSumarProducto(nextText, name); }); setTexto(nextText); notificar("Agregué lo de: " + recipe.nombre + "."); }}>{recipe.nombre}</button>)}</div>
              </section>
              <section className="card">
                <h2>Ofertas que tú viste</h2>
                <div className="form-grid offer-fields">
                  <SearchableCombobox
                    id="oferta-producto"
                    label="Producto"
                    value={ofertaProd}
                    onChange={setOfertaProd}
                    options={PRODUCTOS.map((product) => ({ value: product.id, label: product.nombre }))}
                    placeholder="Buscar producto"
                  />
                  <SearchableCombobox
                    id="oferta-tienda"
                    label="Tienda"
                    value={ofertaTienda}
                    onChange={setOfertaTienda}
                    options={TIENDAS.map((store) => ({ value: store.id, label: store.nombre }))}
                    placeholder="Buscar tienda"
                  />
                  <label className="field-label" htmlFor="oferta-precio">Precio observado
                    <input id="oferta-precio" type="number" min="1" inputMode="decimal" placeholder="$ 35" value={ofertaPrecio} onChange={(event) => setOfertaPrecio(event.target.value)} />
                  </label>
                  <ActionButton className="btn offer-save" status={estadoOferta} successLabel="Oferta guardada" errorLabel="Revisa el precio" onClick={() => {
                    const price = Number(ofertaPrecio);
                    if (!price) {
                      setEstadoOferta("error");
                      return notificar("Escribe el precio de la oferta.", "error");
                    }
                    const next = [{ id: Date.now().toString(), productoId: ofertaProd, tiendaId: ofertaTienda, precio: price }, ...ofertas.filter((offer) => !(offer.productoId === ofertaProd && offer.tiendaId === ofertaTienda))];
                    setOfertas(next);
                    save(K.ofertas, next);
                    setEstadoOferta("success");
                    notificar("Oferta guardada.");
                  }}>Guardar oferta</ActionButton>
                </div>
                {faltanBasicos.length ? <p className="small">¿Se te ofrece? {faltanBasicos.join(", ")}.</p> : null}
              </section>
              <section className="card">
                <h2>Ajustar lista</h2>
                <label className="field-label" htmlFor="nombre-lista">Nombre de la lista</label>
                <input id="nombre-lista" type="text" value={nombreLista} onChange={(event) => setNombreLista(event.target.value)} />
                <label className="field-label text-area-label" htmlFor="texto-lista">Productos, uno por renglón</label>
                <textarea id="texto-lista" value={texto} onChange={(event) => setTexto(event.target.value)} />
                <div className="row">
                  <ActionButton status={estadoLista} successLabel="Lista guardada" errorLabel="Agrega productos primero" onClick={() => {
                    if (!items.length) {
                      setEstadoLista("error");
                      return notificar("Escribe o sube una lista.", "error");
                    }
                    const next = [{ id: Date.now().toString(), nombre: nombreLista, texto, fecha: new Date().toLocaleString("es-MX") }, ...guardadas];
                    setGuardadas(next);
                    save(K.listas, next);
                    setEstadoLista("success");
                    notificar("Lista guardada.");
                  }}>Guardar lista</ActionButton>
                  <button className="btn sec" type="button" aria-expanded={verCatalogo} aria-controls="panel-mas-catalogo" onClick={() => setVerCatalogo((open) => !open)}>{verCatalogo ? "Ocultar catálogo" : "Catálogo"}</button>
                  <button className="btn sec" type="button" aria-expanded={verTiendas} aria-controls="panel-mas-tiendas" onClick={() => setVerTiendas((open) => !open)}>{verTiendas ? "Ocultar tiendas" : "Mis tiendas"}</button>
                  <button className="btn sec" type="button" aria-controls="panel-qr" onClick={() => cambiarPestana("qr")}>Código QR</button>
                </div>
              </section>
              <CollapsiblePanel id="panel-mas-catalogo" open={verCatalogo}>
                <section className="card">
                  <h2>Catálogo con marca</h2>
                  <CatalogoGrid marcas={marcas} onPick={(product) => setPicker({ modo: "agregar", producto: product })} />
                </section>
              </CollapsiblePanel>
              <CollapsiblePanel id="panel-mas-tiendas" open={verTiendas}>
                <section className="card">
                  <h2>Tiendas a comparar</h2>
                  <ChipRail
                    label="Tiendas a comparar"
                    options={TIENDAS.map((store) => ({ id: store.id, label: store.nombre }))}
                    selected={tiendasOn}
                    onToggle={(id) => { const next = { ...tiendasOn, [id]: tiendasOn[id] === false }; setTiendasOn(next); save(K.tiendas, next); }}
                  />
                  <p className="small">Toca una tienda para incluirla o quitarla de la comparación.</p>
                </section>
              </CollapsiblePanel>
              <section className="card"><h2>Instalar y privacidad</h2><div className="row"><a className="btn sec" href="/instalar">Instalar la app</a><a className="btn sec" href="/privacidad">Política de privacidad</a></div></section>
              <section className="card">
                <h2>Listas guardadas</h2>
                {guardadas.length ? guardadas.map((lista) => (
                  <div className="lista-guardada" key={lista.id}>
                    <div><b>{lista.nombre}</b><div className="small">{lista.fecha}</div></div>
                    <div className="row">
                      <button className="btn sec" type="button" onClick={() => { setNombreLista(lista.nombre); setTexto(lista.texto); notificar(`Abrí ${lista.nombre}.`); }}>Abrir</button>
                      <button className="btn danger" type="button" aria-label={`Borrar lista ${lista.nombre}`} onClick={() => { const next = guardadas.filter((item) => item.id !== lista.id); setGuardadas(next); save(K.listas, next); notificar(`Borré ${lista.nombre}.`, "info"); }}>Borrar</button>
                    </div>
                  </div>
                )) : <p className="small">Todavía no hay listas guardadas.</p>}
              </section>
            </>
          ) : null}
        </SwipeTabPanel>

        <SwipeTabPanel
          id="qr"
          labelledBy="tab-qr"
          active={pestana === "qr"}
          exiting={panelAnterior === "qr" && pestana !== "qr"}
          direction={direccionPanel}
          onSwipe={(direction) => cambiarPestana(direction === "next" ? "qr" : "mas")}
        >
          {mostrarPanel("qr") ? (
            <PanelQR
              url={origen}
              dispositivo={dispositivo}
              puedeInstalar={!!promptInstall}
              esApp={esApp}
              estadoInstalar={estadoInstalar}
              onInstalar={instalarApp}
              onAviso={notificar}
            />
          ) : null}
        </SwipeTabPanel>
      </div>

      {picker?.producto ? (
        <SelectorMarca
          producto={picker.producto}
          valorInicial={marcas[picker.producto.id] || ""}
          onElegir={(marca) => {
            if (picker.modo === "agregar") agregarProducto(picker.producto, marca);
            else guardarMarca(picker.producto.id, marca);
            setPicker(null);
          }}
          onCerrar={() => setPicker(null)}
        />
      ) : null}

      <TabBar selected={pestana} onSelect={cambiarPestana} />
      <div className={"install" + (showInstall ? " show" : "")} aria-hidden={!showInstall || undefined}>
        <b>¿La quieres como app?</b>
        <div className="row">
          <ActionButton
            status={estadoInstalar}
            loadingLabel="Abriendo instalación…"
            successLabel="Solicitud enviada"
            errorLabel="Inténtalo de nuevo"
            disabled={!promptInstall}
            onClick={instalarApp}
          >Instalar</ActionButton>
          <button className="btn sec" type="button" onClick={() => setShowInstall(false)}>Ahora no</button>
        </div>
      </div>
    </div>
  );
}
