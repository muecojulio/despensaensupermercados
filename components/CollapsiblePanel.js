"use client";

/** Animated disclosure region. `inert` also removes collapsed controls from tab order. */
export default function CollapsiblePanel({ id, open, children, className = "" }) {
  return (
    <div
      id={id}
      className={["collapse-panel", open ? "is-open" : "", className].filter(Boolean).join(" ")}
      aria-hidden={!open || undefined}
      inert={!open}
    >
      <div className="collapse-panel__inner">{children}</div>
    </div>
  );
}
