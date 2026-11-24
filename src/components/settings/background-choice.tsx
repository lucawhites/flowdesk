"use client";

import { useState, useSyncExternalStore } from "react";
import { LensSegmented } from "@/components/ui/lens-segmented";

/**
 * Sfondo dell'app: «Vetro» = macchie di colore della palette dietro e schede semitrasparenti
 * «Pieno» = fondo uniforme e schede piene (predefinito). Vive in <html data-sfondo> (stili in
 * globals.css) e resta salvato su questo dispositivo, come il tema.
 */
function readBackground() {
  return document.documentElement.dataset.sfondo === "vetro"
    ? "vetro"
    : "pieno";
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
    () => null,
  );
  const [picked, setPicked] = useState<string | null>(null);
  const current = picked ?? stored;
  return (
    <div className="flex flex-col gap-4">
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
          { value: "pieno", label: "Pieno", icon: <Swatch /> },
          { value: "vetro", label: "Vetro", icon: <Swatch glass /> },
        ]}
      />
      {current === "vetro" && <GlassIntensity />}
    </div>
  );
}

const DEFAULT_INTENSITY = 60;

function readIntensity() {
  try {
    const raw = localStorage.getItem("vetroIntensita");
    const n = Number(raw);
    return raw !== null && n >= 0 && n <= 100 ? n : DEFAULT_INTENSITY;
  } catch {
    return DEFAULT_INTENSITY;
  }
}

/** Cursore dell'intensità: cambia dal vivo colori dello sfondo e trasparenza delle schede. */
function GlassIntensity() {
  const stored = useSyncExternalStore(
    () => () => {},
    readIntensity,
    () => DEFAULT_INTENSITY,
  );
  const [value, setValue] = useState<number | null>(null);
  const current = value ?? stored;

  function apply(n: number) {
    setValue(n);
    document.documentElement.style.setProperty("--vetro", String(n / 100));
    try {
      localStorage.setItem("vetroIntensita", String(n));
    } catch {
      // Navigazione privata: vale solo per questa visita.
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-sm">
        <label
          htmlFor="vetro-intensita"
          className="font-medium text-foreground"
        >
          Intensità
        </label>
        <span className="tabular-nums text-muted-foreground">{current}%</span>
      </div>
      <input
        id="vetro-intensita"
        type="range"
        min={0}
        max={100}
        step={5}
        value={current}
        onChange={(e) => apply(Number(e.target.value))}
        className="h-6 w-full cursor-pointer accent-[var(--accent)]"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Leggero</span>
        <button
          type="button"
          onClick={() => apply(DEFAULT_INTENSITY)}
          className="rounded-md px-1.5 hover:text-foreground"
          hidden={current === DEFAULT_INTENSITY}
        >
          Ripristina
        </button>
        <span>Intenso</span>
      </div>
    </div>
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
          background: glass
            ? "color-mix(in srgb, var(--surface) 55%, transparent)"
            : "var(--surface)",
          borderColor: glass ? "rgb(255 255 255 / 0.6)" : "var(--border)",
        }}
      />
    </span>
  );
}
