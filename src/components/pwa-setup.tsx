"use client";

import { useEffect } from "react";
import { syncThemeColor } from "@/lib/theme-color";
import { applyPalette, type PaletteId } from "@/lib/palettes";

// Registra il service worker (pagine anche senza rete, notifiche) e aggiorna il numero
// sull'icona dell'app con le daily ancora da fare oggi. Il numero compare su iPhone solo
// se le notifiche sono attive (lo vuole iOS).
export function PwaSetup({ openToday, palette }: { openToday: number; palette: PaletteId }) {
  // Palette dell'account: se su questo dispositivo era salvata un'altra (scelta da un altro
  // dispositivo), si allinea. Lo script in <head> la applica già all'apertura dalla copia locale.
  useEffect(() => {
    let local: string | null = null;
    try {
      local = localStorage.getItem("palette");
    } catch {
      // Navigazione privata.
    }
    if (local !== palette) applyPalette(palette);
  }, [palette]);

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
