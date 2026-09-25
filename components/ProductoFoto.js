"use client";

export default function ProductoFoto({ producto, grande = false }) {
  const cls = grande ? "foto foto-lg" : "foto";
  if (!producto) {
    return (
      <div className={cls + " foto-vacia"} aria-hidden>
        🛒
      </div>
    );
  }
  return (
    <div className={cls} style={{ background: "#fff" }}>
      <img
        src={producto.imagen}
        alt={producto.nombre}
        width={grande ? 72 : 52}
        height={grande ? 72 : 52}
      />
    </div>
  );
}
