"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";

// "Tira giù per aggiornare" come nelle app iPhone. Attivo solo quando Flowdesk è aperta
// come app installata: dentro Safari o Chrome il browser ha già il suo gesto.
// Ricarica i dati della pagina (router.refresh), senza ricaricare l'app.
const READY = 54; // px di discesa dell'indicatore oltre cui, al rilascio, si aggiorna
const MAX = 110;

export function PullToRefresh() {
  const router = useRouter();
  const [pull, setPull] = useState(0);
  const [refreshing, startRefresh] = useTransition();
  const [released, setReleased] = useState(false);
  const pullRef = useRef(0);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (!standalone) return;

    let start: { x: number; y: number; active: boolean } | null = null;

    const onStart = (e: TouchEvent) => {
      // Solo dalla cima della pagina e senza finestre aperte.
      if (e.touches.length !== 1 || window.scrollY > 0 || document.querySelector('[role="dialog"]')) return;
      start = { x: e.touches[0].clientX, y: e.touches[0].clientY, active: false };
    };

    const onMove = (e: TouchEvent) => {
      if (!start) return;
      const dy = e.touches[0].clientY - start.y;
      const dx = e.touches[0].clientX - start.x;
      if (!start.active) {
        if (Math.abs(dy) < 10 && Math.abs(dx) < 10) return;
        if (dy <= 0 || Math.abs(dx) > dy || window.scrollY > 0) {
          start = null;
          return;
        }
        start.active = true;
      }
      e.preventDefault();
      // Resistenza crescente, come l'elastico di iOS.
      const value = Math.min(MAX, dy * 0.5);
      pullRef.current = value;
      setPull(value);
    };

    const onEnd = () => {
      if (!start?.active) {
        start = null;
        return;
      }
      start = null;
      setReleased(true);
      if (pullRef.current >= READY) {
        if (navigator.vibrate) navigator.vibrate(8);
        startRefresh(() => router.refresh());
      }
      pullRef.current = 0;
      setPull(0);
      window.setTimeout(() => setReleased(false), 300);
    };

    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onEnd);
    document.addEventListener("touchcancel", onEnd);
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
      document.removeEventListener("touchcancel", onEnd);
    };
  }, [router]);

  const ready = pull >= READY;
  const visible = pull > 0 || refreshing;
  const y = refreshing ? 56 : pull;

  return (
    <div
      aria-hidden={!refreshing}
      role="status"
      className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+3.75rem)] z-20 flex justify-center md:hidden"
      style={{
        transform: `translateY(${y - 44}px)`,
        opacity: visible ? 1 : 0,
        transition: released || refreshing ? "transform 300ms cubic-bezier(0.32, 0.72, 0, 1), opacity 200ms" : "none",
      }}
    >
      <span className="glass flex h-9 w-9 items-center justify-center rounded-full border border-border/70 shadow-sm">
        <RotateCw
          className={cn("h-4 w-4", ready || refreshing ? "text-accent" : "text-muted-foreground", refreshing && "animate-spin")}
          style={refreshing ? undefined : { transform: `rotate(${pull * 3}deg)` }}
        />
        <span className="sr-only">{refreshing ? "Aggiornamento in corso" : ""}</span>
      </span>
    </div>
  );
}
