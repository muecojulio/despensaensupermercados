"use client";

import { useEffect, useRef, useState } from "react";

const ACTIONS_WIDTH = 92;

const NON_SWIPE_TARGETS = [
  "a",
  "button",
  "input",
  "select",
  "textarea",
  "label",
  "summary",
  "[role='button']",
  "[role='link']",
  "[role='tab']",
  "[role='combobox']",
  "[role='option']",
  "[role='switch']",
  "[contenteditable='true']",
  ".scroll-rail__viewport",
  ".mapa",
  ".leaflet-container",
].join(",");

/**
 * Tarjeta con acciones contextuales que se revelan deslizando en horizontal
 * (táctil). Reglas clave:
 *
 * - Bloqueo de eje: solo se mueve cuando el gesto es claramente horizontal
 *   (proporción ~1,2); el scroll vertical de la página queda en manos del
 *   navegador (touch-action: pan-y + el gesto vertical cancela el arrastre).
 * - El gesto nunca empieza sobre botones, enlaces, campos, selectores u otros
 *   controles anidados.
 * - El desplazamiento se limita al ancho del panel de acciones; decide abrir o
 *   cerrar por umbral (mitad del panel) o por gesto rápido (velocidad).
 * - El clic posterior a un arrastre se suprime para no activar controles.
 * - Mientras las acciones están ocultas son inert: no entran al orden de foco
 *   ni se anuncian. La misma acción siempre tiene una alternativa visible
 *   (el botón ✕ de la tarjeta), el swipe nunca es la única vía.
 * - Escape, tocar fuera o tocar el contenido cierra el panel.
 */
export default function SwipeRevealCard({ nombre, onQuitar, children, className = "" }) {
  const wrapperRef = useRef(null);
  const gestureRef = useRef(null);
  const openRef = useRef(false);
  const suppressClickRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);

  openRef.current = open;

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return undefined;

    function handleTouchMove(event) {
      const gesture = gestureRef.current;
      if (!gesture || event.touches.length !== 1) return;
      const touch = event.touches[0];
      const dx = touch.clientX - gesture.startX;
      const dy = touch.clientY - gesture.startY;

      if (!gesture.locked) {
        if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.2) gesture.locked = "horizontal";
        else if (Math.abs(dy) > 10) {
          gestureRef.current = null;
          return;
        } else {
          return;
        }
      }

      if (gesture.locked === "horizontal") {
        event.preventDefault();
        const base = openRef.current ? -ACTIONS_WIDTH : 0;
        setDragX(Math.max(-ACTIONS_WIDTH, Math.min(0, base + dx)));
        setDragging(true);
      }
    }

    wrapper.addEventListener("touchmove", handleTouchMove, { passive: false });
    return () => wrapper.removeEventListener("touchmove", handleTouchMove);
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") setOpen(false);
    }
    function handlePointerDown(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown, true);
    };
  }, [open]);

  function resetDrag() {
    setDragging(false);
    setDragX(openRef.current ? -ACTIONS_WIDTH : 0);
  }

  function handleTouchStart(event) {
    gestureRef.current = null;
    if (event.touches.length !== 1) return;
    const target = event.target;
    if (target instanceof Element && target.closest(NON_SWIPE_TARGETS)) return;
    const touch = event.touches[0];
    gestureRef.current = { startX: touch.clientX, startY: touch.clientY, startTime: event.timeStamp, locked: null };
  }

  function handleTouchEnd(event) {
    const gesture = gestureRef.current;
    gestureRef.current = null;

    if (!gesture || gesture.locked !== "horizontal" || event.changedTouches.length !== 1) {
      resetDrag();
      return;
    }

    const touch = event.changedTouches[0];
    const dx = touch.clientX - gesture.startX;
    const elapsed = Math.max(1, event.timeStamp - gesture.startTime);
    const velocity = Math.abs(dx) / elapsed;
    const shouldOpen = dx <= -ACTIONS_WIDTH / 2 || (dx <= -32 && velocity >= 0.5);
    const shouldClose = openRef.current && dx >= 24;

    if (Math.abs(dx) > 8) suppressClickRef.current = true;
    const next = shouldOpen ? true : shouldClose ? false : openRef.current;
    setOpen(next);
    setDragging(false);
    setDragX(next ? -ACTIONS_WIDTH : 0);
  }

  function handleClickCapture(event) {
    if (!suppressClickRef.current) return;
    suppressClickRef.current = false;
    event.preventDefault();
    event.stopPropagation();
  }

  function handleContentClick(event) {
    if (!openRef.current) return;
    const target = event.target;
    if (target instanceof Element && target.closest(NON_SWIPE_TARGETS)) return;
    setOpen(false);
  }

  function handleQuitar() {
    setOpen(false);
    onQuitar?.();
  }

  const offset = dragging ? dragX : open ? -ACTIONS_WIDTH : 0;

  return (
    <div
      ref={wrapperRef}
      data-swipe-card
      className={["swipe-card", open ? "is-open" : "", dragging ? "is-dragging" : "", className].filter(Boolean).join(" ")}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={() => { gestureRef.current = null; resetDrag(); }}
      onClickCapture={handleClickCapture}
    >
      <div className="swipe-card__actions" inert={!open} aria-hidden={!open || undefined}>
        <button type="button" className="swipe-action" aria-label={`Quitar ${nombre} de la lista`} onClick={handleQuitar}>
          <span aria-hidden="true">✕</span>
          <span>Quitar</span>
        </button>
      </div>
      <div
        className="swipe-card__content"
        style={{ transform: `translateX(${offset}px)` }}
        onClick={handleContentClick}
      >
        {children}
      </div>
    </div>
  );
}
