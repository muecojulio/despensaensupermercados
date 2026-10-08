"use client";

const STATUS_LABELS = {
  loading: "Procesando…",
  success: "Listo",
  error: "Inténtalo de nuevo",
};

/** Shared button feedback for actions that can take noticeable time. */
export default function ActionButton({
  status = "idle",
  loadingLabel,
  successLabel,
  errorLabel,
  className = "btn",
  disabled = false,
  children,
  ...props
}) {
  const busy = status === "loading";
  const isDisabled = disabled || busy || status === "success" || status === "disabled";
  const label = status === "loading"
    ? loadingLabel || STATUS_LABELS.loading
    : status === "success"
      ? successLabel || STATUS_LABELS.success
      : status === "error"
        ? errorLabel || STATUS_LABELS.error
        : children;

  return (
    <button
      {...props}
      type={props.type || "button"}
      className={[className, "action-button", `action-${status}`].filter(Boolean).join(" ")}
      data-state={status}
      aria-busy={busy || undefined}
      disabled={isDisabled}
    >
      {status === "loading" ? <span className="action-spinner" aria-hidden="true" /> : null}
      {status === "success" ? <span className="action-status-icon" aria-hidden="true">✓</span> : null}
      {status === "error" ? <span className="action-status-icon" aria-hidden="true">!</span> : null}
      <span>{label}</span>
      {/* Mensaje de estado para lectores de pantalla: loading/éxito/error. */}
      <span className="sr-only" role="status">{status === "idle" || status === "disabled" ? "" : label}</span>
    </button>
  );
}
