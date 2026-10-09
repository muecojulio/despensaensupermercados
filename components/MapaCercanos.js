"use client";

import { useEffect, useRef } from "react";

let cargando;
let falloPrevio = null;

/**
 * Leaflet 1.9.4 se sirve desde /vendor/leaflet (mismo origen).
 * Antes se cargaba desde unpkg: dejar de depender de un tercero evita que un
 * CDN ajeno pueda inyectar código en la app y permite usar una CSP estricta.
 */
function cargarLeaflet() {
  if (typeof window === "undefined") return Promise.reject(new Error("sin ventana"));
  if (window.L) return Promise.resolve(window.L);
  if (falloPrevio) return Promise.reject(falloPrevio);
  if (cargando) return cargando;
  cargando = new Promise((resolve, reject) => {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "/vendor/leaflet/leaflet.css";
    document.head.appendChild(css);
    const script = document.createElement("script");
    script.src = "/vendor/leaflet/leaflet.js";
    // El archivo es propio: no hace falta SRI, basta con servirlo del mismo origen.
    script.async = true;
    script.onload = () => (window.L ? resolve(window.L) : reject(new Error("Leaflet no cargó")));
    script.onerror = () => {
      falloPrevio = new Error("No pude cargar el mapa. Revisa tu conexión e inténtalo de nuevo.");
      reject(falloPrevio);
    };
    document.body.appendChild(script);
  });
  return cargando;
}

export default function MapaCercanos({ yo, puntos = [], radioM = 3000, onError }) {
  const caja = useRef(null);
  const mapa = useRef(null);

  useEffect(() => {
    if (!yo || !caja.current) return;
    let cancel = false;
    cargarLeaflet().then((L) => {
      if (cancel || !caja.current) return;
      if (mapa.current) {
        mapa.current.remove();
        mapa.current = null;
      }
      const map = L.map(caja.current).setView([yo.lat, yo.lon], 14);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      const radio = L.circle([yo.lat, yo.lon], {
        radius: radioM,
        color: "#0e6b4c",
        weight: 1.5,
        opacity: 0.8,
        fillColor: "#0e6b4c",
        fillOpacity: 0.05,
        dashArray: "6 6",
      }).addTo(map);
      L.circleMarker([yo.lat, yo.lon], {
        radius: 10,
        color: "#0e6b4c",
        fillColor: "#0e6b4c",
        fillOpacity: 1,
      })
        .addTo(map)
        .bindPopup("Tú estás aquí");

      const bounds = radio.getBounds();
      (puntos || []).forEach((s) => {
        bounds.extend([s.lat, s.lon]);
        const contenido = document.createElement("div");
        const nombre = document.createElement("strong");
        nombre.textContent = s.nombre;
        contenido.appendChild(nombre);
        const distancia = document.createElement("div");
        distancia.textContent = `${s.km} km`;
        contenido.appendChild(distancia);
        if (s.known) {
          const cadena = document.createElement("div");
          cadena.textContent = "Cadena conocida";
          contenido.appendChild(cadena);
        }
        L.marker([s.lat, s.lon]).addTo(map).bindPopup(contenido);
      });

      map.fitBounds(bounds, { padding: [28, 28], maxZoom: 15 });
      mapa.current = map;
      setTimeout(() => map.invalidateSize(), 200);
    }).catch((error) => {
      if (cancel) return;
      onError?.(error);
    });
    return () => {
      cancel = true;
      if (mapa.current) {
        mapa.current.remove();
        mapa.current = null;
      }
    };
  }, [yo, puntos, radioM, onError]);

  if (!yo) return null;
  return (
    <div
      ref={caja}
      className="mapa"
      role="region"
      aria-label={`Mapa con supermercados en un radio de ${radioM / 1000} km alrededor de tu ubicación`}
    />
  );
}
