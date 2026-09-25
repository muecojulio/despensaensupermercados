"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PRODUCTOS, TIENDAS } from "../data/catalogo";
import { BASICOS, ZONAS } from "../data/zonas";
import { NOMBRE_PASILLO, ORDEN_PASILLO, PESO_KG, RECETAS, SUSTITUTOS, avisoDiaCompra } from "../data/compras";
import { agregarOSumarProducto, borrarLineaEnTexto, cambiarCantidadEnTexto, comparar, emparejar, parsearLista } from "../lib/despensa";
import { leerCualquierArchivo } from "../lib/archivos";
import { buscarSupersCercanos } from "../lib/geo";
import ProductoFoto from "./ProductoFoto";
import MapaCercanos from "./MapaCercanos";
import SelectorMarca from "./SelectorMarca";
import CatalogoGrid from "./CatalogoGrid";

const K = {
  listas: "despensa-mx-listas",
  tiendas: "despensa-mx-tiendas",
  visto: "despensa-mx-inicio",
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

export default function AppClient() {
  const fileRef = useRef(null);
  const [pantalla, setPantalla] = useState("inicio");
  const [texto, setTexto] = useState("");
  const [nombreLista, setNombreLista] = useState("Despensa semanal");
  const [guardadas, setGuardadas] = useState([]);
  const [origen, setOrigen] = useState("");
  const [promptInstall, setPromptInstall] = useState(null);
  const [showInstall, setShowInstall] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [arrastrando, setArrastrando] = useState(false);
  const [verCatalogo, setVerCatalogo] = useState(false);
  const [verTiendas, setVerTiendas] = useState(false);
  const [verQR, setVerQR] = useState(false);
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
  const [pestana, setPestana] = useState("subir");
  const [cercaMsg, setCercaMsg] = useState("");
  const [cercanos, setCercanos] = useState([]);
  const [miUbicacion, setMiUbicacion] = useState(null);
  const [sucursal, setSucursal] = useState(null);
  const [demoActiva, setDemoActiva] = useState(false);
  const [partidaTexto, setPartidaTexto] = useState("");
  const [partidaModo, setPartidaModo] = useState("zona");
  const [esApp, setEsApp] = useState(false);
  const [picker, setPicker] = useState(null);

  useEffect(() => {
    try {
      const g = load(K.listas); if (g) setGuardadas(g);
      const t = load(K.tiendas); if (t) setTiendasOn({ ...Object.fromEntries(TIENDAS.map((x) => [x.id, true])), ...t });
      if (localStorage.getItem(K.visto) === "app") setPantalla("app");
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
      if (instalada) setPantalla("app");
      if (localStorage.getItem(K.demo) !== "1") {
        setTexto(DEMO); setNombreLista("Ejemplo para ver cómo funciona"); setPantalla("app"); setPestana("resultado"); setDemoActiva(true); setAntojos({ "linea-2": true }); setMensaje("Esto es una precarga de ejemplo. Puedes quitarla con el botón.");
      }
    } catch {}
    setOrigen(window.location.origin);
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
    const onPrompt = (e) => { e.preventDefault(); setPromptInstall(e); setShowInstall(true); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const items = useMemo(() => parsearLista(texto), [texto]);
  const activas = useMemo(() => TIENDAS.filter((t) => tiendasOn[t.id] !== false), [tiendasOn]);
  const ranking = useMemo(() => comparar(items, activas.length ? activas : TIENDAS, ofertas, { skipIds: alacena, maxPorItem: soloOferta, antojoIds: antojos }), [items, activas, ofertas, alacena, soloOferta, antojos]);
  const ganadora = ranking[0];
  const masCara = ranking[ranking.length - 1];
  const ahorro = ganadora && masCara ? Math.max(0, masCara.total - ganadora.total) : 0;
  const ahorroPct = masCara && masCara.total ? Math.round((ahorro / masCara.total) * 100) : 0;
  const noReconocidos = useMemo(() => items.filter((it) => !emparejar(it).producto), [items]);
  const pesoKg = useMemo(() => items.reduce((acc, item) => alacena[item.id] ? acc : acc + ((emparejar(item).producto ? PESO_KG[emparejar(item).producto.id] || 0.4 : 0.4) * item.cantidad), 0), [items, alacena]);
  const itemsPasillo = useMemo(() => [...items].sort((a, b) => (ORDEN_PASILLO[emparejar(a).producto?.categoria] || 9) - (ORDEN_PASILLO[emparejar(b).producto?.categoria] || 9)), [items]);
  const tope = Number(presupuesto) || 0;
  const baseGanadora = ganadora?.totalBase ?? ganadora?.total ?? 0;
  const antojoGanadora = ganadora?.totalAntojo ?? 0;
  const qr = origen ? "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=" + encodeURIComponent(origen) : "";
  const hechos = items.filter((it) => marcados[it.id]).length;
  const faltanBasicos = BASICOS.filter((b) => !items.some((it) => it.nombre.toLowerCase().includes(b.split(" ")[0])));

  function irApp(extra) {
    setPantalla("app"); save(K.visto, "app");
    if (extra === "archivo") setTimeout(() => fileRef.current?.click(), 200);
    if (extra === "catalogo") { setVerCatalogo(true); setPestana("lista"); }
  }
  function quitarPrecarga() {
    setTexto(""); setNombreLista("Despensa semanal"); setMarcados({}); setAlacena({}); setSoloOferta({}); setAntojos({}); setSucursal(null); setDemoActiva(false); setPestana("subir"); save(K.demo, "1"); setMensaje("Quité la precarga.");
  }
  function verPrecarga() {
    setTexto(DEMO); setNombreLista("Ejemplo para ver cómo funciona"); setPantalla("app"); setPestana("resultado"); setDemoActiva(true); setAntojos({ "linea-2": true }); localStorage.removeItem(K.demo); setMensaje("Volvió el ejemplo.");
  }
  function guardarMarca(id, marca) {
    const next = { ...marcas }; if (marca) next[id] = marca; else delete next[id]; setMarcas(next); save(K.marcas, next);
  }
  function agregarProducto(prod, marca) {
    setTexto((p) => agregarOSumarProducto(p, prod.aliases[0] || prod.nombre));
    if (marca) guardarMarca(prod.id, marca);
    setMensaje(marca ? "Agregué " + prod.nombre + " · " + marca : "Agregué " + prod.nombre);
  }
  async function procesarArchivo(file) {
    if (!file) return;
    try {
      const { texto: content, aviso } = await leerCualquierArchivo(file);
      setTexto(content); setNombreLista(file.name.replace(/\.[^.]+$/, "")); setMarcados({}); setPantalla("app"); save(K.visto, "app");
      setMensaje((aviso || "Archivo listo.") + " Abajo está la tienda más barata.");
      setTimeout(() => setPestana("resultado"), 80);
    } catch (err) { setMensaje(err.message || "No pude leer ese archivo."); setPantalla("app"); }
  }
  function origenMaps() {
    if (partidaModo === "gps" && miUbicacion) return miUbicacion.lat + "," + miUbicacion.lon;
    if (partidaModo === "manual" && partidaTexto.trim()) return partidaTexto.trim() + " México";
    return zona + " México";
  }
  const mapaUrl = (n) => "https://www.google.com/maps/dir/?api=1&origin=" + encodeURIComponent(origenMaps()) + "&destination=" + encodeURIComponent(n + " " + zona + " México");
  const rumboUrl = (lat, lon) => "https://www.google.com/maps/dir/?api=1&origin=" + encodeURIComponent(origenMaps()) + "&destination=" + lat + "," + lon;
  async function buscarCerca() {
    if (!navigator.geolocation) return setCercaMsg("Este celular no da ubicación.");
    setCercaMsg("Pidiendo tu ubicación...");
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude, lon = pos.coords.longitude;
      setMiUbicacion({ lat, lon });
      try { const lista = await buscarSupersCercanos(lat, lon); setCercanos(lista); setCercaMsg(lista.length ? "Estos te quedan más cerca:" : "No encontré súpers cerca."); }
      catch (err) { setCercaMsg(err.message || "No pude buscar ahora."); }
    }, () => setCercaMsg("No autorizaste la ubicación."), { enableHighAccuracy: true, timeout: 12000 });
  }
  async function leerFoto(e) {
    const file = e.target.files?.[0]; e.target.value = ""; if (!file) return;
    setFotoMsg("Leyendo la foto...");
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await fetch("/api/lista-foto", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imagen: reader.result }) });
        const data = await res.json();
        if (!res.ok) return setFotoMsg(data.error || "No pude leer la foto.");
        setTexto(data.texto); setPantalla("app"); save(K.visto, "app"); setFotoMsg("Foto leída."); setPestana("resultado");
      } catch { setFotoMsg("No se pudo enviar la foto."); }
    };
    reader.readAsDataURL(file);
  }

  if (pantalla === "inicio") {
    return (
      <div className="wrap">
        <section className="hero"><h1>Despensa MX</h1><p>Sube tu lista. En segundos te digo en qué súper del Valle de México sale más barato comprar todo junto.</p></section>
        <div className="home-actions">
          <button className="btn home-btn" type="button" onClick={() => irApp("archivo")}>Subir archivo de despensa</button>
          <button className="btn sec home-btn" type="button" onClick={() => irApp()}>Escribir la lista a mano</button>
          <label className="btn sec home-btn" style={{ cursor: "pointer" }}>Foto de la lista<input type="file" accept="image/*" capture="environment" hidden onChange={leerFoto} /></label>
          <button className="btn sec home-btn" type="button" onClick={() => irApp("catalogo")}>Ver catálogo</button>
          <button className="btn sec home-btn" type="button" onClick={verPrecarga}>Ver ejemplo precargado</button>
        </div>
        <p className="hint">Precios de referencia para CDMX y zona conurbada.</p>
        <input ref={fileRef} type="file" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; procesarArchivo(f); }} />
      </div>
    );
  }

  return (
    <div className={"wrap compacto" + (esApp ? " app-mode" : "")}>
      <section className="hero mini">
        <div><h1>Despensa MX</h1><p>Todo junto, en la tienda más barata.</p></div>
        <div className="row">
          <button className="btn sec" type="button" onClick={() => setPantalla("inicio")}>Inicio</button>
          {demoActiva ? <button className="btn danger" type="button" onClick={quitarPrecarga}>Quitar precarga</button> : <button className="btn sec" type="button" onClick={verPrecarga}>Ver ejemplo</button>}
        </div>
      </section>
      <p className="hint">Precios de referencia, no del anaquel de hoy.</p>
      {avisoDia ? <p className="aviso">{avisoDia}</p> : null}
      {items.length ? <p className="hint">Peso estimado: {pesoKg.toFixed(1)} kg.</p> : null}

      {pestana === "subir" ? (
        <section className="card">
          <h2>1. Sube tu despensa</h2>
          <div className={"drop" + (arrastrando ? " on" : "")} onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }} onDragLeave={() => setArrastrando(false)} onDrop={(e) => { e.preventDefault(); setArrastrando(false); procesarArchivo(e.dataTransfer.files?.[0]); }}>
            <b>Arrastra cualquier archivo aquí</b>
            <p className="small">Mejor: .txt, .csv o Excel.</p>
            <div className="row" style={{ justifyContent: "center" }}>
              <a className="btn sec" href="/ejemplo-despensa.txt" download>Ejemplo .txt</a>
              <a className="btn sec" href="/ejemplo-despensa.csv" download>Ejemplo CSV</a>
            </div>
            <label className="btn" style={{ cursor: "pointer" }}>Elegir archivo<input ref={fileRef} type="file" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; procesarArchivo(f); }} /></label>
            <label className="btn sec" style={{ cursor: "pointer", marginLeft: 8 }}>Foto<input type="file" accept="image/*" capture="environment" hidden onChange={leerFoto} /></label>
          </div>
          {mensaje ? <p className="small">{mensaje}</p> : null}
          {fotoMsg ? <p className="small">{fotoMsg}</p> : null}
          <div className="row" style={{ marginTop: 12 }}>
            <label>Tu alcaldía<select value={zona} onChange={(e) => { setZona(e.target.value); save(K.zona, e.target.value); }}>{ZONAS.map((z) => <option key={z} value={z}>{z}</option>)}</select></label>
            <label>Presupuesto tope<input type="number" min="0" placeholder="1200" value={presupuesto} onChange={(e) => { setPresupuesto(e.target.value); save(K.presu, e.target.value); }} /></label>
          </div>
        </section>
      ) : null}

      {pestana === "resultado" ? (
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
                  <button className="btn sec" type="button" onClick={() => { const next = [{ id: Date.now().toString(), fecha: new Date().toLocaleString("es-MX"), tienda: ganadora.tienda.nombre, total: ganadora.total, zona, nombre: nombreLista }, ...historial].slice(0, 20); setHistorial(next); save(K.hist, next); setMensaje("Historial guardado."); }}>Historial</button>
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

      {pestana === "cerca" ? (
        <section className="card">
          <h2>Súpers cerca de ti</h2>
          <input type="text" placeholder="Punto de partida" value={partidaTexto} onChange={(e) => setPartidaTexto(e.target.value)} />
          <div className="row">
            <button className="btn" type="button" onClick={() => { if (!partidaTexto.trim()) return setCercaMsg("Escribe una dirección."); setPartidaModo("manual"); save(K.partida, { modo: "manual", texto: partidaTexto }); setCercaMsg("Sales desde: " + partidaTexto); }}>Punto de partida</button>
            <button className="btn sec" type="button" onClick={buscarCerca}>Buscar cerca</button>
          </div>
          {cercaMsg ? <p className="small">{cercaMsg}</p> : null}
          {miUbicacion ? <MapaCercanos yo={miUbicacion} puntos={cercanos} /> : null}
          {cercanos.map((s) => (
            <div className="tienda" key={s.id}>
              <div><b>{s.nombre}</b><div className="small">{s.km} km</div></div>
              <div className="row">
                <button className="btn sec" type="button" onClick={() => { setSucursal(s); setPestana("resultado"); }}>Usar esta</button>
                <a className="btn sec" href={rumboUrl(s.lat, s.lon)} target="_blank" rel="noreferrer">Cómo llegar</a>
              </div>
            </div>
          ))}
        </section>
      ) : null}

      {pestana === "mas" ? (
        <>
          <section className="card">
            <h2>Si vas a cocinar esto</h2>
            <div className="row">{RECETAS.map((r) => <button key={r.id} className="btn sec" type="button" onClick={() => { let n = texto; r.items.forEach((nom) => { n = agregarOSumarProducto(n, nom); }); setTexto(n); setMensaje("Agregué lo de: " + r.nombre); }}>{r.nombre}</button>)}</div>
          </section>
          <section className="card">
            <h2>Ofertas que tú viste</h2>
            <div className="row">
              <select value={ofertaProd} onChange={(e) => setOfertaProd(e.target.value)}>{PRODUCTOS.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select>
              <select value={ofertaTienda} onChange={(e) => setOfertaTienda(e.target.value)}>{TIENDAS.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}</select>
              <input type="number" min="1" placeholder="$" value={ofertaPrecio} onChange={(e) => setOfertaPrecio(e.target.value)} />
              <button className="btn" type="button" onClick={() => { const precio = Number(ofertaPrecio); if (!precio) return setMensaje("Escribe el precio."); const next = [{ id: Date.now().toString(), productoId: ofertaProd, tiendaId: ofertaTienda, precio }, ...ofertas.filter((o) => !(o.productoId === ofertaProd && o.tiendaId === ofertaTienda))]; setOfertas(next); save(K.ofertas, next); setMensaje("Oferta guardada."); }}>Guardar</button>
            </div>
            {faltanBasicos.length ? <p className="small">¿Se te ofrece? {faltanBasicos.join(", ")}.</p> : null}
          </section>
          <section className="card">
            <h2>Ajustar lista</h2>
            <input type="text" value={nombreLista} onChange={(e) => setNombreLista(e.target.value)} />
            <textarea value={texto} onChange={(e) => setTexto(e.target.value)} />
            <div className="row">
              <button className="btn" type="button" onClick={() => { if (!items.length) return setMensaje("Escribe o sube una lista."); const next = [{ id: Date.now().toString(), nombre: nombreLista, texto, fecha: new Date().toLocaleString("es-MX") }, ...guardadas]; setGuardadas(next); save(K.listas, next); setMensaje("Lista guardada."); }}>Guardar</button>
              <button className="btn sec" type="button" onClick={() => setVerCatalogo((v) => !v)}>{verCatalogo ? "Ocultar catálogo" : "Catálogo"}</button>
              <button className="btn sec" type="button" onClick={() => setVerTiendas((v) => !v)}>Mis tiendas</button>
              <button className="btn sec" type="button" onClick={() => setVerQR((v) => !v)}>QR</button>
            </div>
          </section>
          {verQR && qr ? <section className="card qr-box"><img src={qr} alt="QR" /></section> : null}
          {verCatalogo ? <section className="card"><h2>Catálogo con marca</h2><CatalogoGrid marcas={marcas} onPick={(prod) => setPicker({ modo: "agregar", producto: prod })} /></section> : null}
          {verTiendas ? <section className="card">{TIENDAS.map((t) => <label key={t.id} className="check-line"><input type="checkbox" checked={tiendasOn[t.id] !== false} onChange={() => { const next = { ...tiendasOn, [t.id]: tiendasOn[t.id] === false }; setTiendasOn(next); save(K.tiendas, next); }} />{t.nombre}</label>)}</section> : null}
          <section className="card"><h2>Privacidad</h2><a className="btn sec" href="/privacidad">Política de privacidad</a></section>
          <section className="card"><h2>Listas guardadas</h2>{guardadas.map((lista) => <div className="lista-guardada" key={lista.id}><div><b>{lista.nombre}</b></div><div className="row"><button className="btn sec" type="button" onClick={() => { setNombreLista(lista.nombre); setTexto(lista.texto); }}>Abrir</button><button className="btn danger" type="button" onClick={() => { const next = guardadas.filter((l) => l.id !== lista.id); setGuardadas(next); save(K.listas, next); }}>Borrar</button></div></div>)}</section>
        </>
      ) : null}

      {pestana === "lista" ? (
        <>
          <section className="card">
            <h2>Toca para agregar (y elegir marca)</h2>
            <p className="small">Al tocar el producto se abre la marca.</p>
            <CatalogoGrid marcas={marcas} onPick={(prod) => setPicker({ modo: "agregar", producto: prod })} />
          </section>
          <section className="card">
            <h2>Para llevar al súper {items.length ? "(" + hechos + "/" + items.length + ")" : ""}</h2>
            {itemsPasillo.map((item) => {
              const indice = items.findIndex((x) => x.id === item.id);
              const producto = emparejar(item).producto;
              const cat = producto?.categoria || "despensa";
              return (
                <div className={"item-card" + (marcados[item.id] ? " hecho" : "") + (antojos[item.id] ? " antojo" : "")} key={item.id} style={{ background: antojos[item.id] ? "#ffe8f0" : COLORES[cat] }}>
                  <label className="check"><input type="checkbox" checked={!!marcados[item.id]} onChange={() => setMarcados((m) => ({ ...m, [item.id]: !m[item.id] }))} /></label>
                  <button type="button" className="foto-tap" onClick={() => producto && setPicker({ modo: "linea", producto })}><ProductoFoto producto={producto} /></button>
                  <div className="item-info">
                    <button type="button" className="nombre-tap" onClick={() => producto && setPicker({ modo: "linea", producto })}><b>{producto ? producto.nombre : item.nombre}</b></button>
                    <div className="small">{NOMBRE_PASILLO[cat] || "Otros"} · {item.cantidad}{marcas[producto?.id] ? " · Marca: " + marcas[producto.id] : ""}</div>
                    {producto && SUSTITUTOS[producto.id] ? <div className="small">{SUSTITUTOS[producto.id]}</div> : null}
                    <label className="small"><input type="checkbox" checked={!!alacena[item.id]} onChange={() => { const n = { ...alacena, [item.id]: !alacena[item.id] }; setAlacena(n); save(K.alacena, n); }} /> Ya está en casa</label>
                    <label className="small"><input type="checkbox" checked={!!antojos[item.id]} onChange={() => { const n = { ...antojos, [item.id]: !antojos[item.id] }; setAntojos(n); save(K.antojo, n); }} /> Antojo</label>
                  </div>
                  <div className="qty">
                    <button type="button" onClick={() => setTexto((p) => cambiarCantidadEnTexto(p, indice, Math.max(1, item.cantidad - 1)))}>−</button>
                    <input type="number" min="1" value={item.cantidad} onChange={(e) => setTexto((p) => cambiarCantidadEnTexto(p, indice, Math.max(1, Number(e.target.value) || 1)))} />
                    <button type="button" onClick={() => setTexto((p) => cambiarCantidadEnTexto(p, indice, item.cantidad + 1))}>+</button>
                  </div>
                  <button className="btn-x" type="button" onClick={() => setTexto((p) => borrarLineaEnTexto(p, indice))}>✕</button>
                </div>
              );
            })}
          </section>
        </>
      ) : null}

      {picker?.producto ? (
        <SelectorMarca producto={picker.producto} valorInicial={marcas[picker.producto.id] || ""} onElegir={(marca) => { if (picker.modo === "agregar") agregarProducto(picker.producto, marca); else guardarMarca(picker.producto.id, marca); setPicker(null); }} onCerrar={() => setPicker(null)} />
      ) : null}

      <nav className="tabbar">
        <button className={"tab" + (pestana === "subir" ? " on" : "")} type="button" onClick={() => setPestana("subir")}>Subir</button>
        <button className={"tab" + (pestana === "resultado" ? " on" : "")} type="button" onClick={() => setPestana("resultado")}>Resultado</button>
        <button className={"tab" + (pestana === "lista" ? " on" : "")} type="button" onClick={() => setPestana("lista")}>Lista</button>
        <button className={"tab" + (pestana === "cerca" ? " on" : "")} type="button" onClick={() => { setPestana("cerca"); if (!cercanos.length) buscarCerca(); }}>Cerca</button>
        <button className={"tab" + (pestana === "mas" ? " on" : "")} type="button" onClick={() => setPestana("mas")}>Más</button>
      </nav>
      <div className={"install" + (showInstall ? " show" : "")}>
        <b>¿La quieres como app?</b>
        <div className="row">
          <button className="btn" type="button" onClick={async () => { if (!promptInstall) return; promptInstall.prompt(); await promptInstall.userChoice; setPromptInstall(null); setShowInstall(false); }}>Instalar</button>
          <button className="btn sec" type="button" onClick={() => setShowInstall(false)}>Ahora no</button>
        </div>
      </div>
    </div>
  );
}
