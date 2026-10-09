/**
 * Marquesina con precios de referencia del catálogo.
 * Va duplicada para que el ciclo no deje un hueco; al pasar el cursor se
 * detiene y con prefers-reduced-motion se queda quieta.
 */
export default function TiraPrecios({ items = [], etiqueta = "Precios de referencia" }) {
  if (!items.length) return null;

  const pista = (copia) => (
    <div className="tira-precios__pista" key={copia} aria-hidden={copia === 2 || undefined}>
      {items.map((item) => (
        <span className="tira-precios__item" key={`${copia}-${item.id}`}>
          <span aria-hidden="true">{item.emoji}</span>
          {item.nombre}
          <b>{item.precio}</b>
        </span>
      ))}
    </div>
  );

  return (
    <div className="tira-precios" role="group" aria-label={etiqueta}>
      {pista(1)}
      {pista(2)}
    </div>
  );
}
