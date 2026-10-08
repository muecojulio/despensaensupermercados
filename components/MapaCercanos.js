"use client";

import { useEffect, useRef } from "react";

let cargando;

function cargarLeaflet() {
  if (typeof window === "undefined") return Promise.reject();
  if (window.L) return Promise.resolve(window.L);
  if (cargando) return cargando;
  cargando = new Promise((resolve, reject) => {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(css);
    const s = document.createElement("script");
    s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    s.onload = () => resolve(window.L);
    s.onerror = reject;
    document.body.appendChild(s);
  });
  return cargando;
}

export default function MapaCercanos({ yo, lugares, puntos }) {
  lugares = lugares || puntos;
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
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);
      L.circleMarker([yo.lat, yo.lon], {
        radius: 10,
        color: "#0e6b4c",
        fillColor: "#0e6b4c",
        fillOpacity: 1,
      })
        .addTo(map)
        .bindPopup("Tú estás aquí");
      const pts = [[yo.lat, yo.lon]];
      (lugares || []).forEach((s) => {
        pts.push([s.lat, s.lon]);
        L.marker([s.lat, s.lon])
          .addTo(map)
          .bindPopup(
            "<b>" +
              s.nombre +
              "</b><br>" +
              s.km +
              " km" +
              (s.known ? "<br>Cadena conocida" : "")
          );
      });
      if (pts.length > 1) map.fitBounds(pts, { padding: [28, 28], maxZoom: 15 });
      mapa.current = map;
      setTimeout(() => map.invalidateSize(), 200);
    });
    return () => {
      cancel = true;
      if (mapa.current) {
        mapa.current.remove();
        mapa.current = null;
      }
    };
  }, [yo, lugares]);

  if (!yo) return null;
  return (
    <div
      ref={caja}
      className="mapa"
      role="region"
      aria-label="Mapa con los súpers más cercanos a tu ubicación"
    />
  );
}
