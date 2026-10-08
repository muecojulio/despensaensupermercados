"use client";

import { useRef } from "react";

const NON_SWIPE_TARGETS = [
  "a",
  "button",
  "input",
  "textarea",
  "select",
  "label",
  "summary",
  "[role='button']",
  "[role='link']",
  "[role='tab']",
  "[role='combobox']",
  "[role='listbox']",
  "[role='option']",
  "[contenteditable='true']",
  "[data-no-tab-swipe]",
  "[data-swipe-card]",
  ".scroll-rail__viewport",
  ".combobox-popover",
  ".mapa",
  ".leaflet-container",
].join(",");

/** A tab panel that recognizes deliberate horizontal touch swipes, not page scroll. */
export default function SwipeTabPanel({
  id,
  labelledBy,
  active,
  exiting,
  direction = "forward",
  onSwipe,
  children,
}) {
  const touchStart = useRef(null);

  function handleTouchStart(event) {
    touchStart.current = null;
    if (!active || event.touches.length !== 1) return;

    const target = event.target;
    if (target instanceof Element && target.closest(NON_SWIPE_TARGETS)) return;

    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY, time: event.timeStamp };
  }

  function handleTouchEnd(event) {
    const start = touchStart.current;
    touchStart.current = null;
    if (!active || !start || event.changedTouches.length !== 1) return;

    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    const horizontal = Math.abs(dx);
    const vertical = Math.abs(dy);
    const elapsed = Math.max(1, event.timeStamp - start.time);
    const enoughDistance = horizontal >= 58;
    const quickFlick = horizontal >= 32 && elapsed <= 230 && horizontal / elapsed >= 0.5;

    if (horizontal > vertical * 1.2 && (enoughDistance || quickFlick)) {
      onSwipe(dx < 0 ? "next" : "previous");
    }
  }

  return (
    <section
      id={`panel-${id}`}
      role="tabpanel"
      aria-labelledby={labelledBy}
      aria-hidden={!active || undefined}
      inert={!active}
      hidden={!active && !exiting}
      tabIndex={active ? 0 : -1}
      data-motion={direction}
      className={[
        "tab-panel",
        active ? "is-active" : "",
        exiting ? "is-exiting" : "",
      ].filter(Boolean).join(" ")}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={() => { touchStart.current = null; }}
    >
      {children}
    </section>
  );
}
