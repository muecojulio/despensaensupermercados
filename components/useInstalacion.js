"use client";

import { useEffect, useState } from "react";
import { detectarDispositivo } from "../lib/dispositivo";

/**
 * Junta el aviso de instalación del navegador (beforeinstallprompt) con la
 * detección del dispositivo y del modo “ya instalada”.
 */
export default function useInstalacion() {
  const [promptInstall, setPromptInstall] = useState(null);
  const [esApp, setEsApp] = useState(false);
  const [dispositivo, setDispositivo] = useState(null);
  const [estado, setEstado] = useState("idle");

  useEffect(() => {
    setDispositivo(detectarDispositivo());
    const instalada = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
    setEsApp(!!instalada);
  }, []);

  useEffect(() => {
    const onPrompt = (event) => {
      event.preventDefault();
      setPromptInstall(event);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  async function instalar() {
    if (!promptInstall) {
      setEstado("error");
      return;
    }
    setEstado("loading");
    try {
      promptInstall.prompt();
      await promptInstall.userChoice;
      setPromptInstall(null);
      setEstado("success");
    } catch {
      setEstado("error");
    }
  }

  return { puedeInstalar: !!promptInstall, esApp, dispositivo, estado, instalar };
}
