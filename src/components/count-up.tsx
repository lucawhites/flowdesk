"use client";

import { useEffect, useRef, useState } from "react";

const DURATION = 700;

/**
 * Numero che sale fino al valore: da 0 alla prima apertura, poi dal valore mostrato
 * quando cambia (es. una daily spuntata). Senza animazione se l'utente ha "Riduci movimento".
 * Il server disegna già il numero finale, quindi niente salto se JavaScript tarda.
 */
export function CountUp({ value }: { value: number }) {
  const [shown, setShown] = useState(value);
  // Ultimo numero davvero disegnato dall'animazione: si parte da lì (0 la prima volta).
  const last = useRef(0);

  useEffect(() => {
    const start = last.current;
    if (start === value || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      last.current = value;
      setShown(value);
      return;
    }
    let frame = 0;
    const t0 = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / DURATION);
      const current = Math.round(start + (value - start) * (1 - Math.pow(1 - t, 3)));
      last.current = current;
      setShown(current);
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <span className="tabular-nums">{shown}</span>;
}
