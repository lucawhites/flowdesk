"use client";

import { useState, useSyncExternalStore } from "react";
import { AArrowUp, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SIZES = [
  { id: "s", label: "Piccolo" },
  { id: "m", label: "Normale" },
  { id: "l", label: "Grande" },
  { id: "xl", label: "Molto grande" },
] as const;

/**
 * Dimensione del testo dell'app. Lo stato vive in <html data-text-size> (le misure
 * sono in globals.css) e resta salvato su questo dispositivo, come il tema.
 */
function readTextSize() {
  return document.documentElement.dataset.textSize ?? "m";
}

function saveTextSize(id: string) {
  document.documentElement.setAttribute("data-text-size", id);
  try {
    localStorage.setItem("textSize", id);
  } catch {
    // Navigazione privata: la scelta vale solo per questa visita.
  }
}

/** Dimensione del testo come scelta a pulsanti (pagina Impostazioni). */
export function TextSizeChoice() {
  const stored = useSyncExternalStore(
    () => () => {},
    readTextSize,
    () => null
  );
  const [picked, setPicked] = useState<string | null>(null);
  const current = picked ?? stored;
  return (
    <div role="radiogroup" aria-label="Dimensione del testo" className="grid grid-cols-4 gap-1 rounded-xl bg-foreground/10 p-1">
      {SIZES.map((size, i) => {
        const active = current === size.id;
        return (
          <button
            key={size.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => {
              saveTextSize(size.id);
              setPicked(size.id);
            }}
            className={
              "flex cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-2 text-center text-[0.6875rem] leading-tight font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring " +
              (active ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground")
            }
          >
            <span className={active ? "text-accent" : undefined} style={{ fontSize: `${0.75 + i * 0.125}rem`, lineHeight: 1.2, fontWeight: 600 }}>
              Aa
            </span>
            {size.label}
          </button>
        );
      })}
    </div>
  );
}

export function TextSizeMenu() {
  const [current, setCurrent] = useState("m");

  function choose(id: string) {
    setCurrent(id);
    saveTextSize(id);
  }

  return (
    <DropdownMenu onOpenChange={(open) => open && setCurrent(document.documentElement.dataset.textSize ?? "m")}>
      <DropdownMenuTrigger
        aria-label="Dimensione del testo"
        title="Dimensione del testo"
        className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full bg-foreground/10 text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <AArrowUp className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Dimensione del testo</DropdownMenuLabel>
        {SIZES.map((size) => (
          <DropdownMenuItem key={size.id} onSelect={() => choose(size.id)} className="justify-between">
            {size.label}
            {current === size.id && <Check className="h-4 w-4 text-accent" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
