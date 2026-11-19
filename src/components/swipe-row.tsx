"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

// Riga scorrevole come in Mail su iPhone: trascinando la riga a destra o a sinistra compare
// l'azione sotto; superata la soglia, al rilascio l'azione parte. Solo con il dito (touch),
// solo se il movimento è chiaramente orizzontale: lo scorrimento verticale e la maniglia
// di riordino restano liberi. Si muove solo `transform`.
const LOCK = 10; // px prima di decidere la direzione
const THRESHOLD = 0.32; // quota della larghezza oltre la quale l'azione parte
const SETTLE_MS = 240;
const EASE = "cubic-bezier(0.32, 0.72, 0, 1)";

export type SwipeAction = {
  label: string;
  icon: ReactNode;
  /** Classi di colore dello sfondo dell'azione (es. "bg-success text-white"). */
  tone: string;
  run: () => void;
};

export function SwipeRow({
  left,
  right,
  className,
  children,
}: {
  /** Azione che compare trascinando verso destra (sta sul lato sinistro). */
  left?: SwipeAction;
  /** Azione che compare trascinando verso sinistra (sta sul lato destro). */
  right?: SwipeAction;
  className?: string;
  children: ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [dx, setDx] = useState(0);
  const [settling, setSettling] = useState(false);
  const [reached, setReached] = useState(false);
  const actions = useRef({ left, right });
  useEffect(() => {
    actions.current = { left, right };
  });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let start: { x: number; y: number; locked: boolean } | null = null;
    let current = 0;
    let suppressClick = false;

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      // Dal bordo sinistro del telefono parte il menù laterale, non l'azione della riga.
      if (e.touches[0].clientX <= 44 && window.matchMedia("(max-width: 767px)").matches) return;
      const target = e.target as HTMLElement;
      // Maniglia di riordino, campi e menù: niente gesto.
      if (target.closest('[aria-label="Trascina per riordinare"], input, textarea, [role="menu"], [data-no-swipe]')) return;
      start = { x: e.touches[0].clientX, y: e.touches[0].clientY, locked: false };
      current = 0;
    };

    const onMove = (e: TouchEvent) => {
      if (!start) return;
      const mx = e.touches[0].clientX - start.x;
      const my = e.touches[0].clientY - start.y;
      if (!start.locked) {
        if (Math.abs(mx) < LOCK && Math.abs(my) < LOCK) return;
        const { left: l, right: r } = actions.current;
        const allowed = mx > 0 ? !!l : !!r;
        if (Math.abs(my) > Math.abs(mx) || !allowed) {
          start = null;
          return;
        }
        start.locked = true;
      }
      e.preventDefault();
      e.stopPropagation(); // il menù laterale non deve partire mentre si scorre una riga
      const width = root.offsetWidth;
      const { left: l, right: r } = actions.current;
      let next = mx;
      if (next > 0 && !l) next = 0;
      if (next < 0 && !r) next = 0;
      // Oltre la soglia la riga continua ma con un po' di resistenza.
      const limit = width * THRESHOLD;
      if (Math.abs(next) > limit) next = Math.sign(next) * (limit + (Math.abs(next) - limit) * 0.35);
      current = next;
      setDx(next);
      setReached(Math.abs(next) >= limit - 1);
    };

    const onEnd = () => {
      if (!start) return;
      const wasLocked = start.locked;
      start = null;
      if (!wasLocked) return;
      suppressClick = true;
      window.setTimeout(() => (suppressClick = false), 350);
      const width = root.offsetWidth;
      const fire = Math.abs(current) >= width * THRESHOLD - 1;
      const action = current > 0 ? actions.current.left : actions.current.right;
      setSettling(true);
      if (fire && action) {
        // La riga esce dal lato, poi l'azione parte e la riga torna al suo posto.
        setDx(Math.sign(current) * width);
        if (navigator.vibrate) navigator.vibrate(8);
        window.setTimeout(() => {
          action.run();
          setDx(0);
          window.setTimeout(() => setSettling(false), SETTLE_MS);
        }, SETTLE_MS);
      } else {
        setDx(0);
        window.setTimeout(() => setSettling(false), SETTLE_MS);
      }
      current = 0;
      setReached(false);
    };

    // Dopo uno scorrimento il "tocco" non deve aprire il dettaglio della daily.
    const onClick = (e: MouseEvent) => {
      if (suppressClick) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    root.addEventListener("touchstart", onStart, { passive: true });
    root.addEventListener("touchmove", onMove, { passive: false });
    root.addEventListener("touchend", onEnd);
    root.addEventListener("touchcancel", onEnd);
    root.addEventListener("click", onClick, true);
    return () => {
      root.removeEventListener("touchstart", onStart);
      root.removeEventListener("touchmove", onMove);
      root.removeEventListener("touchend", onEnd);
      root.removeEventListener("touchcancel", onEnd);
      root.removeEventListener("click", onClick, true);
    };
  }, []);

  const shown = dx > 0 ? left : dx < 0 ? right : undefined;

  return (
    <div ref={rootRef} className={cn("relative overflow-hidden rounded-xl", className)}>
      {shown && (
        <div
          aria-hidden
          className={cn(
            "absolute inset-0 flex items-center px-5 text-sm font-semibold transition-opacity",
            shown.tone,
            dx > 0 ? "justify-start" : "justify-end",
            reached ? "opacity-100" : "opacity-80"
          )}
        >
          <span
            className="flex items-center gap-2 transition-transform duration-150"
            style={{ transform: reached ? "scale(1.08)" : "scale(1)" }}
          >
            {shown.icon}
            {shown.label}
          </span>
        </div>
      )}
      <div
        className="relative will-change-transform"
        style={{
          transform: dx ? `translateX(${dx}px)` : undefined,
          transition: settling ? `transform ${SETTLE_MS}ms ${EASE}` : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}
