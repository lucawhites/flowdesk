"use client";

import { useState } from "react";
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
export function TextSizeMenu() {
  const [current, setCurrent] = useState("m");

  function choose(id: string) {
    setCurrent(id);
    document.documentElement.setAttribute("data-text-size", id);
    try {
      localStorage.setItem("textSize", id);
    } catch {
      // Navigazione privata: la scelta vale solo per questa visita.
    }
  }

  return (
    <DropdownMenu onOpenChange={(open) => open && setCurrent(document.documentElement.dataset.textSize ?? "m")}>
      <DropdownMenuTrigger
        aria-label="Dimensione del testo"
        title="Dimensione del testo"
        className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full bg-surface-muted text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
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
