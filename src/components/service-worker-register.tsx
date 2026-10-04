"use client";

import { useEffect } from "react";

/** Registra o service worker (só em produção, para não interferir no hot reload do dev). */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch((error) => {
      console.error("Falha ao registrar o service worker:", error);
    });
  }, []);

  return null;
}
