"use client";

export default function ProductoFoto({ producto }) {
  if (!producto) {
    return (
      <div className="foto foto-vacia" aria-hidden>
        🛒
      </div>
    );
  }
  return (
    <div className="foto">
      <img src={producto.imagen} alt={producto.nombre} width={52} height={52} />
    </div>
  );
}
