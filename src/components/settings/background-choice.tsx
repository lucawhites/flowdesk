"use client";

import { useState, useSyncExternalStore } from "react";
import { LensSegmented } from "@/components/ui/lens-segmented";

/**
 * Sfondo dell'app: «Vetro» = macchie di colore della palette dietro e schede semitrasparenti
 * (predefinito), «Pieno» = fondo uniforme e schede piene. Vive in <html data-sfondo> (stili in
 * globals.css) e resta salvato su questo dispositivo, come il tema.
 */
function readBackground() {
  return document.documentElement.dataset.sfondo === "pieno" ? "pieno" : "vetro";
}

function saveBackground(id: string) {
  document.documentElement.setAttribute("data-sfondo", id);
  try {
    localStorage.setItem("sfondo", id);
  } catch {
    // Navigazione privata: la scelta vale solo per questa visita.
  }
}

export function BackgroundChoice() {
  const stored = useSyncExternalStore(
    () => () => {},
    readBackground,
    () => null
  );
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <LensSegmented
      ariaLabel="Sfondo"
      fill
      size="lg"
      value={picked ?? stored}
      onChange={(id) => {
        saveBackground(id);
        setPicked(id);
      }}
      options={[
        { value: "vetro", label: "Vetro", icon: <Swatch glass /> },
        { value: "pieno", label: "Pieno", icon: <Swatch /> },
      ]}
    />
  );
}

/** Piccola anteprima: tre macchie sfumate con una scheda sopra, oppure un fondo uniforme. */
function Swatch({ glass = false }: { glass?: boolean }) {
  return (
    <span
      aria-hidden
      className="relative block h-5 w-8 overflow-hidden rounded-md border border-border"
      style={{
        background: glass
          ? "radial-gradient(70% 90% at 20% 20%, var(--accent-light), transparent 75%), radial-gradient(70% 90% at 90% 90%, var(--accent), transparent 75%), var(--background)"
          : "var(--background)",
      }}
    >
      <span
        className="absolute inset-x-1.5 bottom-1 top-1.5 rounded-sm border"
        style={{
          background: glass ? "color-mix(in srgb, var(--surface) 55%, transparent)" : "var(--surface)",
          borderColor: glass ? "rgb(255 255 255 / 0.6)" : "var(--border)",
        }}
      />
    </span>
  );
}
