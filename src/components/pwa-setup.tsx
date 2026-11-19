"use client";

import { useEffect } from "react";
import { syncThemeColor } from "@/lib/theme-color";

// Registra il service worker (pagine anche senza rete, notifiche) e aggiorna il numero
// sull'icona dell'app con le daily ancora da fare oggi. Il numero compare su iPhone solo
// se le notifiche sono attive (lo vuole iOS).
export function PwaSetup({ openToday }: { openToday: number }) {
  // Barra di stato dello stesso colore del tema scelto in Flowdesk (non di quello dell'iPhone).
  useEffect(() => {
    syncThemeColor();
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch((error) => console.error("Service worker non registrato:", error));
  }, []);

  useEffect(() => {
    if (!("setAppBadge" in navigator)) return;
    const job = openToday > 0 ? navigator.setAppBadge(openToday) : navigator.clearAppBadge();
    job.catch(() => {});
  }, [openToday]);

  return null;
}
