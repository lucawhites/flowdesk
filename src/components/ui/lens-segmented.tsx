"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

// Selettore a lente, come la barra in basso (stili .lens-track e .tab-lens in globals.css):
// - al tocco la capsula di vetro scivola sulla scelta con effetto molla;
// - tenendo premuto si gonfia in una lente che segue il dito; al rilascio sceglie l'opzione sotto.
// Su iPhone il tocco lungo non apre il menù Copia: i gesti di sistema sono bloccati sul selettore.
// Da tastiera: i pulsanti restano normali (Tab, Invio, frecce non necessarie).
const MOVE_THRESHOLD = 6;

export type LensOption<T extends string> = { value: T; label: ReactNode; icon?: ReactNode; ariaLabel?: string };

export function LensSegmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  fill = false,
  size = "sm",
  className,
}: {
  options: readonly LensOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  ariaLabel: string;
  /** A tutta larghezza (Impostazioni) invece che larga quanto il contenuto. */
  fill?: boolean;
  /** sm = una riga di testo; lg = icona sopra la scritta. */
  size?: "sm" | "lg";
  className?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const press = useRef<{ startX: number; moved: boolean; pointerId: number } | null>(null);
  const [lens, setLens] = useState<{ x: number; hover: number } | null>(null);
  const n = options.length;
  const selected = options.findIndex((o) => o.value === value);

  // Blocca selezione del testo, menù Copia e anteprime dei link col dito (iPhone).
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const block = (e: TouchEvent) => e.preventDefault();
    track.addEventListener("touchstart", block, { passive: false });
    return () => track.removeEventListener("touchstart", block);
  }, []);

  // Area utile = binario meno il bordo interno di 4px (p-1), dove stanno le opzioni e la capsula.
  const inner = () => {
    const rect = trackRef.current!.getBoundingClientRect();
    return { left: rect.left + 4, width: rect.width - 8 };
  };
  const slotAt = (clientX: number) => {
    const { left, width } = inner();
    return Math.max(0, Math.min(n - 1, Math.floor(((clientX - left) / width) * n)));
  };
  const lensAt = (clientX: number) => {
    const { left, width } = inner();
    const slot = width / n;
    const x = Math.max(slot / 2, Math.min(width - slot / 2, clientX - left));
    return { x, hover: slotAt(clientX) };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    window.getSelection()?.removeAllRanges();
    press.current = { startX: e.clientX, moved: false, pointerId: e.pointerId };
    setLens(lensAt(e.clientX));
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const p = press.current;
    if (!p || p.pointerId !== e.pointerId) return;
    if (!p.moved && Math.abs(e.clientX - p.startX) > MOVE_THRESHOLD) {
      p.moved = true;
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        // Puntatore non più attivo: si continua senza aggancio.
      }
    }
    setLens(lensAt(e.clientX));
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const p = press.current;
    press.current = null;
    setLens(null);
    if (!p || p.pointerId !== e.pointerId) return;
    const index = slotAt(e.clientX);
    if (options[index] && options[index].value !== value) onChange(options[index].value);
  };
  const onPointerCancel = () => {
    press.current = null;
    setLens(null);
  };

  const pillStyle: React.CSSProperties = lens
    ? { transform: `translateX(calc(${lens.x}px - 50%)) scale(1.1, 1.22)` }
    : { transform: `translateX(${Math.max(selected, 0) * 100}%) scale(1)` };

  return (
    <div
      ref={trackRef}
      role="radiogroup"
      aria-label={ariaLabel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onContextMenu={(e) => e.preventDefault()}
      style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`, touchAction: "none" }}
      className={cn("lens-track relative grid rounded-full p-1", fill ? "w-full" : "self-start", className)}
    >
      <span
        aria-hidden
        className={cn(
          "tab-lens pointer-events-none absolute inset-y-1 left-1 rounded-full",
          lens ? "tab-lens-pressed" : "tab-lens-rest",
          lens || selected >= 0 ? "opacity-100" : "opacity-0"
        )}
        style={{ ...pillStyle, width: `calc((100% - 0.5rem) / ${n})` }}
      />
      {options.map((option, index) => {
        const active = index === selected;
        const hovered = lens?.hover === index;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={option.ariaLabel}
            // Solo tastiera (detail 0): col dito e col mouse sceglie onPointerUp.
            onClick={(e) => {
              if (e.detail === 0) onChange(option.value);
            }}
            className={cn(
              "relative z-10 flex min-w-0 cursor-pointer items-center justify-center rounded-full font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
              size === "lg" ? "flex-col gap-1 px-1 py-2 text-xs" : "gap-1.5 px-3.5 py-1.5 text-xs",
              active || hovered ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {option.icon && (
              <span className={cn("tab-icon flex", hovered && "tab-icon-lifted", (active || hovered) && "text-accent")}>
                {option.icon}
              </span>
            )}
            <span className={size === "lg" ? "text-center leading-tight" : "truncate"}>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
