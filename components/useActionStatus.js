"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Keeps success/error feedback briefly visible, then returns the action to idle. */
export default function useActionStatus() {
  const [status, setStatus] = useState("idle");
  const timerRef = useRef(null);

  const updateStatus = useCallback((nextStatus) => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    setStatus(nextStatus);

    if (nextStatus === "success" || nextStatus === "error") {
      const delay = nextStatus === "success" ? 1800 : 4200;
      timerRef.current = window.setTimeout(() => {
        setStatus((current) => current === nextStatus ? "idle" : current);
        timerRef.current = null;
      }, delay);
    }
  }, []);

  useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
  }, []);

  return [status, updateStatus];
}
