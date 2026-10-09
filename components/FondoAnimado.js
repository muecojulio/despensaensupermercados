/**
 * Fondo de la app: cuatro luces que respiran, una rejilla de puntos y grano.
 * Está fuera del flujo (position: fixed) y no recibe eventos; con
 * prefers-reduced-motion las luces se quedan quietas.
 */
export default function FondoAnimado() {
  return (
    <div className="fondo-vivo" aria-hidden="true">
      <span className="fondo-vivo__luz a" />
      <span className="fondo-vivo__luz b" />
      <span className="fondo-vivo__luz c" />
      <span className="fondo-vivo__luz d" />
      <span className="fondo-vivo__puntos" />
      <span className="fondo-vivo__grano" />
    </div>
  );
}
