/**
 * Juego de iconos en SVG (sin dependencias ni peticiones externas).
 * Todos se dibujan con el color actual del texto y son decorativos: el nombre
 * accesible lo pone siempre el botón o la etiqueta que los envuelve.
 */
const TRAZO = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const ICONOS = {
  inicio: (
    <>
      <path d="M3.5 11 12 4l8.5 7" {...TRAZO} />
      <path d="M6 10.2V19a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-8.8" {...TRAZO} />
      <path d="M10.2 20v-5.2h3.6V20" {...TRAZO} />
    </>
  ),
  subir: (
    <>
      <path d="M12 15.5V6.8" {...TRAZO} />
      <path d="m8.6 10.2 3.4-3.4 3.4 3.4" {...TRAZO} />
      <path d="M5.5 16.5a3.8 3.8 0 0 1 .3-7.6 5.6 5.6 0 0 1 10.8 1.3 3.7 3.7 0 0 1 2.4 6.3Z" {...TRAZO} />
    </>
  ),
  resultado: (
    <>
      <path d="M7.5 4.5h9v4a4.5 4.5 0 0 1-9 0Z" {...TRAZO} />
      <path d="M16.5 5.5h2.2a2.2 2.2 0 0 1-2.2 2.2M7.5 5.5H5.3a2.2 2.2 0 0 0 2.2 2.2" {...TRAZO} />
      <path d="M12 13v3.5" {...TRAZO} />
      <path d="M9 20h6l-.6-3.5h-4.8Z" {...TRAZO} />
    </>
  ),
  lista: (
    <>
      <path d="M6.5 4.6h11a1 1 0 0 1 1 1v12.8a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V5.6a1 1 0 0 1 1-1Z" {...TRAZO} />
      <path d="M9.2 9h5.6M9.2 12.6h5.6M9.2 16.2h3.6" {...TRAZO} />
    </>
  ),
  cerca: (
    <>
      <path d="M12 20.5s6.2-5.4 6.2-10.2a6.2 6.2 0 1 0-12.4 0C5.8 15.1 12 20.5 12 20.5Z" {...TRAZO} />
      <circle cx="12" cy="10.1" r="2.4" {...TRAZO} />
    </>
  ),
  mas: (
    <>
      <circle cx="6" cy="12" r="1.5" fill="currentColor" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <circle cx="18" cy="12" r="1.5" fill="currentColor" />
    </>
  ),
  qr: (
    <>
      <rect x="4" y="4" width="6.2" height="6.2" rx="1.6" {...TRAZO} />
      <rect x="13.8" y="4" width="6.2" height="6.2" rx="1.6" {...TRAZO} />
      <rect x="4" y="13.8" width="6.2" height="6.2" rx="1.6" {...TRAZO} />
      <path d="M14.4 14.4h2.4v2.4h-2.4zM18 18h2.4v2.4H18zM14.4 18h2.4v2.4h-2.4z" fill="currentColor" />
    </>
  ),
  archivo: (
    <>
      <path d="M13.6 3.5H7.4a1.9 1.9 0 0 0-1.9 1.9v13.2a1.9 1.9 0 0 0 1.9 1.9h9.2a1.9 1.9 0 0 0 1.9-1.9V8.5Z" {...TRAZO} />
      <path d="M13.4 3.6v4.9h4.9" {...TRAZO} />
    </>
  ),
  camara: (
    <>
      <path d="M4.5 8.6h2.2l1.3-2h8l1.3 2h2.2a1 1 0 0 1 1 1v7.9a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1V9.6a1 1 0 0 1 1-1Z" {...TRAZO} />
      <circle cx="12" cy="13.2" r="3.2" {...TRAZO} />
    </>
  ),
  catalogo: (
    <>
      <rect x="4" y="4" width="6.6" height="6.6" rx="1.8" {...TRAZO} />
      <rect x="13.4" y="4" width="6.6" height="6.6" rx="1.8" {...TRAZO} />
      <rect x="4" y="13.4" width="6.6" height="6.6" rx="1.8" {...TRAZO} />
      <rect x="13.4" y="13.4" width="6.6" height="6.6" rx="1.8" {...TRAZO} />
    </>
  ),
  instalar: (
    <>
      <path d="M12 4.5v10.2" {...TRAZO} />
      <path d="m8.4 11.1 3.6 3.6 3.6-3.6" {...TRAZO} />
      <path d="M5 19.2h14" {...TRAZO} />
    </>
  ),
  bolsa: (
    <>
      <path d="M5.6 8h12.8l-1.1 11.2a1 1 0 0 1-1 .9H7.7a1 1 0 0 1-1-.9Z" {...TRAZO} />
      <path d="M9.2 10.4V6.9a2.8 2.8 0 0 1 5.6 0v3.5" {...TRAZO} />
    </>
  ),
  chat: (
    <>
      <path d="M20.4 11.6a7.9 7.9 0 0 1-11.5 7L4.2 20l1.4-4.3a7.9 7.9 0 1 1 14.8-4.1Z" {...TRAZO} />
      <path d="M9 11.4c0 .5.4.9.9.9s.9-.4.9-.9-.4-.9-.9-.9-.9.4-.9.9Zm4.2 0c0 .5.4.9.9.9s.9-.4.9-.9-.4-.9-.9-.9-.9.4-.9.9Z" fill="currentColor" />
    </>
  ),
  ruta: (
    <>
      <path d="M9 4.6 4.2 6.6v12.8L9 17.4l6 2 4.8-2V4.6l-4.8 2Z" {...TRAZO} />
      <path d="M9 4.6v12.8M15 6.6v12.8" {...TRAZO} />
    </>
  ),
  check: <path d="m5 12.8 4.4 4.4L19 6.6" {...TRAZO} />,
  copiar: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2.2" {...TRAZO} />
      <path d="M15.6 6.2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7.6a2 2 0 0 0 2 2h.2" {...TRAZO} />
    </>
  ),
  compartir: (
    <>
      <path d="M12 15V4.6" {...TRAZO} />
      <path d="m8.6 8 3.4-3.4L15.4 8" {...TRAZO} />
      <path d="M5.4 13.6V18a2 2 0 0 0 2 2h9.2a2 2 0 0 0 2-2v-4.4" {...TRAZO} />
    </>
  ),
  descarga: (
    <>
      <path d="M12 5v9.6" {...TRAZO} />
      <path d="m8.4 11 3.6 3.6L15.6 11" {...TRAZO} />
      <path d="M5.4 19h13.2" {...TRAZO} />
    </>
  ),
  basura: (
    <>
      <path d="M5.4 7.4h13.2" {...TRAZO} />
      <path d="M9.6 7.4V5.6a1.2 1.2 0 0 1 1.2-1.2h2.4a1.2 1.2 0 0 1 1.2 1.2v1.8" {...TRAZO} />
      <path d="M7 7.4l.9 11.6a1.2 1.2 0 0 0 1.2 1.1h5.8a1.2 1.2 0 0 0 1.2-1.1L17 7.4" {...TRAZO} />
    </>
  ),
  lapiz: (
    <>
      <path d="M16.4 4.6l3 3L9 18l-4 1 1-4Z" {...TRAZO} />
      <path d="m14.4 6.6 3 3" {...TRAZO} />
    </>
  ),
  estrella: (
    <path
      d="m12 4.6 2.3 4.8 5.2.7-3.8 3.7.9 5.2-4.6-2.5-4.6 2.5.9-5.2L4.5 10l5.2-.7Z"
      {...TRAZO}
    />
  ),
  ubicacion: (
    <>
      <circle cx="12" cy="12" r="7.6" {...TRAZO} />
      <path d="M12 2.8v3.2M12 18v3.2M2.8 12h3.2M18 12h3.2" {...TRAZO} />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
    </>
  ),
  escudo: (
    <>
      <path d="M12 3.6 5.4 6.2v5.6c0 3.8 2.9 6.7 6.6 8.2 3.7-1.5 6.6-4.4 6.6-8.2V6.2Z" {...TRAZO} />
      <path d="m9.3 11.9 2 2 3.4-3.6" {...TRAZO} />
    </>
  ),
  reloj: (
    <>
      <circle cx="12" cy="12" r="8" {...TRAZO} />
      <path d="M12 7.6V12l3 1.9" {...TRAZO} />
    </>
  ),
  foco: (
    <>
      <path d="M9.2 17.4h5.6M10.4 20.4h3.2" {...TRAZO} />
      <path d="M12 3.6a5.8 5.8 0 0 1 3.4 10.5c-.5.4-.8 1-.8 1.6H9.4c0-.6-.3-1.2-.8-1.6A5.8 5.8 0 0 1 12 3.6Z" {...TRAZO} />
    </>
  ),
};

export default function Icono({ nombre, className = "btn-icono" }) {
  const dibujo = ICONOS[nombre];
  if (!dibujo) return null;
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {dibujo}
    </svg>
  );
}

export function IconoPestaña({ nombre }) {
  return <Icono nombre={nombre} className="tab-icono" />;
}
