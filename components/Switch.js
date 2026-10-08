"use client";

/**
 * Interruptor accesible: comunica nombre y estado con role="switch" y
 * aria-checked, responde a teclado (Espacio/Enter, como botón nativo) y anima
 * el movimiento de la pastilla con una transición breve. El estado nunca
 * depende solo de la animación: el color y la posición de la pastilla cambian.
 */
export default function Switch({ id, label, checked, onChange, disabled = false, className = "" }) {
  const labelId = id ? `${id}-label` : undefined;
  return (
    <div className={["switch-line", className].filter(Boolean).join(" ")}>
      <span className="switch-text" id={labelId}>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        aria-label={labelId ? undefined : label}
        disabled={disabled}
        className="switch"
        onClick={() => onChange(!checked)}
      >
        <span className="switch-thumb" aria-hidden="true" />
      </button>
    </div>
  );
}
