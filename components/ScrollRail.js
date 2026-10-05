"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Native horizontal scroller with edge hints that only appear while content is
 * actually clipped. The browser keeps ownership of touch/momentum scrolling.
 */
export default function ScrollRail({
  as: Element = "div",
  className = "",
  viewportClassName = "",
  role = "group",
  ariaLabel,
  children,
  ...props
}) {
  const viewportRef = useRef(null);
  const pointerRef = useRef(null);
  const suppressClickRef = useRef(false);
  const [overflow, setOverflow] = useState({ start: false, end: false, has: false });

  const measure = useCallback(() => {
    const node = viewportRef.current;
    if (!node) return;

    const maxScroll = Math.max(0, node.scrollWidth - node.clientWidth);
    const next = {
      has: maxScroll > 2,
      start: maxScroll > 2 && node.scrollLeft > 2,
      end: maxScroll > 2 && node.scrollLeft < maxScroll - 2,
    };

    setOverflow((current) =>
      current.start === next.start && current.end === next.end && current.has === next.has
        ? current
        : next
    );
  }, []);

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return undefined;

    measure();
    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    const mutationObserver = typeof MutationObserver !== "undefined"
      ? new MutationObserver(measure)
      : null;

    resizeObserver?.observe(node);
    mutationObserver?.observe(node, { childList: true, subtree: true, characterData: true });
    window.addEventListener("resize", measure, { passive: true });

    return () => {
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [children, measure]);

  function handlePointerDown(event) {
    if (!event.isPrimary || event.button !== 0) return;
    suppressClickRef.current = false;
    pointerRef.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      dragged: false,
    };
  }

  function handlePointerMove(event) {
    const pointer = pointerRef.current;
    if (!pointer || pointer.id !== event.pointerId || pointer.dragged) return;
    if (Math.max(Math.abs(event.clientX - pointer.x), Math.abs(event.clientY - pointer.y)) > 8) {
      pointer.dragged = true;
    }
  }

  function handlePointerUp(event) {
    const pointer = pointerRef.current;
    if (!pointer || pointer.id !== event.pointerId) return;
    suppressClickRef.current = pointer.dragged;
    pointerRef.current = null;
  }

  function handleClickCapture(event) {
    if (event.detail === 0 || !suppressClickRef.current) return;
    suppressClickRef.current = false;
    event.preventDefault();
    event.stopPropagation();
  }

  const classes = [
    "scroll-rail",
    className,
    overflow.has ? "has-overflow" : "",
    overflow.start ? "has-overflow-start" : "",
    overflow.end ? "has-overflow-end" : "",
  ].filter(Boolean).join(" ");

  return (
    <div className={classes} data-overflow={overflow.has ? "true" : "false"}>
      <Element
        {...props}
        ref={viewportRef}
        role={role || undefined}
        aria-label={ariaLabel || undefined}
        className={["scroll-rail__viewport", viewportClassName].filter(Boolean).join(" ")}
        onScroll={measure}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => { pointerRef.current = null; }}
        onClickCapture={handleClickCapture}
      >
        {children}
      </Element>
    </div>
  );
}
