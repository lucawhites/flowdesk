"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { savePalette } from "@/app/(app)/actions";
import { PALETTES, applyPalette, type PaletteId } from "@/lib/palettes";
import { cn } from "@/lib/utils";

/** Scelta della palette con anteprima chiara e scura; si applica subito e si salva nell'account. */
export function PaletteChoice({ initial }: { initial: PaletteId }) {
  const [current, setCurrent] = useState<PaletteId>(initial);
  const [, startTransition] = useTransition();

  const choose = (id: PaletteId) => {
    if (id === current) return;
    const previous = current;
    setCurrent(id);
    applyPalette(id);
    startTransition(async () => {
      const result = await savePalette(id);
      if (!result.ok) {
        setCurrent(previous);
        applyPalette(previous);
        toast.error("Non è stato possibile salvare la palette");
      }
    });
  };

  return (
    <div role="radiogroup" aria-label="Colori" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {PALETTES.map((p) => {
        const active = current === p.id;
        return (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => choose(p.id)}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-xl border bg-surface p-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
              active ? "border-accent ring-1 ring-accent" : "border-border hover:border-foreground/30"
            )}
          >
            <span className="flex shrink-0 gap-1" aria-hidden>
              {(["light", "dark"] as const).map((mode) => {
                const [bg, surface, text, accent] = p.preview[mode];
                return (
                  <span
                    key={mode}
                    className="flex h-12 w-9 flex-col justify-between rounded-lg border border-black/10 p-1.5"
                    style={{ background: bg }}
                  >
                    <span className="h-1.5 w-5 rounded-full" style={{ background: text }} />
                    <span className="h-3 w-full rounded" style={{ background: surface }} />
                    <span className="h-2 w-4 rounded-full" style={{ background: accent }} />
                  </span>
                );
              })}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-foreground">{p.name}</span>
              <span className="block text-xs text-muted-foreground">{p.note}</span>
            </span>
            {active && <Check className="h-4 w-4 shrink-0 text-accent" />}
          </button>
        );
      })}
    </div>
  );
}
