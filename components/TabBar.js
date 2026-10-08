"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ScrollRail from "./ScrollRail";

export const APP_TABS = [
  { id: "subir", label: "Subir" },
  { id: "resultado", label: "Resultado" },
  { id: "lista", label: "Lista" },
  { id: "cerca", label: "Cerca" },
  { id: "mas", label: "Más" },
  { id: "qr", label: "QR" },
];

export default function TabBar({ selected, onSelect }) {
  const buttonsRef = useRef({});
  const [indicator, setIndicator] = useState({ x: 0, width: 0 });
  const [indicatorReady, setIndicatorReady] = useState(false);

  const updateIndicator = useCallback(() => {
    const button = buttonsRef.current[selected];
    if (!button) return;
    setIndicator({ x: button.offsetLeft, width: button.offsetWidth });
    setIndicatorReady(true);
  }, [selected]);

  useEffect(() => {
    const button = buttonsRef.current[selected];
    if (!button) return undefined;

    updateIndicator();
    const rail = button.closest(".tabbar");
    if (rail && rail.scrollWidth > rail.clientWidth + 2) {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (typeof button.scrollIntoView === "function") {
        button.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest", inline: "center" });
      }
    }

    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateIndicator) : null;
    if (rail) observer?.observe(rail);
    observer?.observe(button);
    window.addEventListener("resize", updateIndicator, { passive: true });

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", updateIndicator);
    };
  }, [selected, updateIndicator]);

  function handleKeyDown(event, currentIndex) {
    let nextIndex = currentIndex;
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % APP_TABS.length;
    else if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + APP_TABS.length) % APP_TABS.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = APP_TABS.length - 1;
    else return;

    event.preventDefault();
    const next = APP_TABS[nextIndex];
    onSelect(next.id);
    buttonsRef.current[next.id]?.focus();
  }

  return (
    <ScrollRail
      as="nav"
      role="tablist"
      ariaLabel="Secciones principales"
      aria-orientation="horizontal"
      className="tabbar-rail"
      viewportClassName="tabbar"
    >
      <span
        className={"tab-indicator" + (indicatorReady ? " is-ready" : "")}
        aria-hidden="true"
        style={{ width: `${indicator.width}px`, transform: `translateX(${indicator.x}px)` }}
      />
      {APP_TABS.map((tab, index) => {
        const active = selected === tab.id;
        return (
          <button
            key={tab.id}
            ref={(node) => { buttonsRef.current[tab.id] = node; }}
            id={`tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls={`panel-${tab.id}`}
            tabIndex={active ? 0 : -1}
            className={"tab" + (active ? " on" : "")}
            onClick={() => onSelect(tab.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {tab.label}
          </button>
        );
      })}
    </ScrollRail>
  );
}
