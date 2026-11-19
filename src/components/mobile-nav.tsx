"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { SidebarNav } from "@/components/sidebar-nav";
import { OPEN_MENU_EVENT } from "@/components/tab-bar";
import { TextSizeMenu } from "@/components/text-size-menu";
import { ThemeChoice } from "@/components/theme-toggle";

// Menù del telefono: si apre con "Altro" nella barra in basso ed entra da DESTRA, dal lato del
// pollice. Il bordo sinistro resta all'iPhone per il gesto "indietro".
// Da aperto si chiude trascinandolo verso destra: segue il dito e al rilascio si chiude o torna
// al suo posto in base a quanto è uscito e alla velocità. Si muove solo `transform`.
const LOCK = 10; // px di movimento prima di decidere se il gesto è orizzontale
const SETTLE_MS = 260;
const EASE = "cubic-bezier(0.32, 0.72, 0, 1)";

type Drag = { startX: number; startY: number; startT: number; lastX: number; lastT: number; locked: boolean; from: "closed" | "open" };

export function MobileNav({ teamName }: { teamName?: string | null }) {
  const [open, setOpen] = useState(false);
  // Durante il gesto: posizione del pannello in px (0 = aperto, +w = chiuso fuori a destra) e sua larghezza; null quando non si trascina.
  const [offset, setOffset] = useState<{ x: number; w: number } | null>(null);
  const [settling, setSettling] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  // Il pulsante "Altro" della barra in basso apre questo menù.
  useEffect(() => {
    const openMenu = () => setOpen(true);
    window.addEventListener(OPEN_MENU_EVENT, openMenu);
    return () => window.removeEventListener(OPEN_MENU_EVENT, openMenu);
  }, []);

  const close = () => setOpen(false);
  const width = () => panelRef.current?.offsetWidth ?? Math.min(288, window.innerWidth * 0.85);

  // Porta il pannello a destinazione con l'effetto molla, poi chiude davvero se serve.
  const settle = (toOpen: boolean) => {
    setSettling(true);
    const w = width();
    setOffset({ x: toOpen ? 0 : w, w });
    window.setTimeout(() => {
      if (toOpen) {
        setSettling(false);
        setOffset(null);
        return;
      }
      // Già fuori schermo col dito: si chiude subito (lo stile in linea ha animation: none,
      // quindi niente seconda animazione di uscita), poi si azzera la posizione.
      setOpen(false);
      window.setTimeout(() => {
        setSettling(false);
        setOffset(null);
      }, 0);
    }, SETTLE_MS);
  };

  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 767px)");

    const onStart = (e: TouchEvent) => {
      if (!mobile.matches || e.touches.length !== 1 || settling) return;
      const t = e.touches[0];
      if (!openRef.current) return;
      drag.current = { startX: t.clientX, startY: t.clientY, startT: e.timeStamp, lastX: t.clientX, lastT: e.timeStamp, locked: false, from: "open" };
    };

    const onMove = (e: TouchEvent) => {
      const d = drag.current;
      if (!d) return;
      const t = e.touches[0];
      const dx = t.clientX - d.startX;
      const dy = t.clientY - d.startY;
      if (!d.locked) {
        if (Math.abs(dx) < LOCK && Math.abs(dy) < LOCK) return;
        // Verticale, o verso sinistra: lascia scorrere il menù.
        if (Math.abs(dy) > Math.abs(dx) || dx < 0) {
          drag.current = null;
          return;
        }
        d.locked = true;
      }
      e.preventDefault();
      d.lastX = t.clientX;
      d.lastT = e.timeStamp;
      const w = width();
      setOffset({ x: Math.max(0, Math.min(w, dx)), w });
    };

    const onEnd = (e: TouchEvent) => {
      const d = drag.current;
      drag.current = null;
      if (!d?.locked) return;
      const w = width();
      const dx = d.lastX - d.startX;
      const elapsed = Math.max(1, e.timeStamp - d.startT);
      const velocity = dx / elapsed; // px/ms, positivo verso destra (= verso la chiusura)
      const shown = 1 - Math.max(0, Math.min(w, dx)) / w; // 1 aperto … 0 chiuso
      const toOpen = Math.abs(velocity) > 0.5 ? velocity < 0 : shown > 0.5;
      settle(toOpen);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settling]);

  // Stile del pannello e del velo mentre si trascina o si assesta; altrimenti valgono le animazioni CSS.
  const moving = offset !== null;
  const progress = moving ? 1 - offset.x / offset.w : 1;
  const panelStyle = moving
    ? { transform: `translateX(${offset.x}px)`, transition: settling ? `transform ${SETTLE_MS}ms ${EASE}` : "none", animation: "none" }
    : undefined;
  const overlayStyle = moving
    ? { opacity: Math.max(0, Math.min(1, progress)), transition: settling ? `opacity ${SETTLE_MS}ms ${EASE}` : "none", animation: "none" }
    : undefined;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          style={overlayStyle}
          className="dialog-overlay fixed inset-0 z-50 bg-black/30 backdrop-blur-[3px] md:hidden"
        />
        <DialogPrimitive.Content
          ref={panelRef}
          aria-describedby={undefined}
          style={panelStyle}
          className="drawer-content fixed inset-y-0 right-0 z-50 flex w-72 max-w-[85vw] flex-col glass border-l border-border/70 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-[calc(1.25rem+env(safe-area-inset-top))] shadow-lg outline-none will-change-transform md:hidden"
        >
          <div className="mb-8 flex items-center justify-between">
            <Link href="/home" onClick={close} className="flex items-center gap-2 px-1">
              <AppLogo className="h-8 w-8" />
              <DialogPrimitive.Title className="text-base font-semibold tracking-tight text-foreground">
                Flowdesk
              </DialogPrimitive.Title>
            </Link>
            <DialogPrimitive.Close
              aria-label="Chiudi il menù"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-5 w-5" />
            </DialogPrimitive.Close>
          </div>
          <SidebarNav onNavigate={close} />
          <div className="mt-6 flex flex-col gap-3 border-t border-border pt-4">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Aspetto</p>
            <ThemeChoice />
            <div className="flex items-center justify-between px-1 text-sm text-foreground">
              Dimensione del testo <TextSizeMenu />
            </div>
          </div>
          {teamName && (
            <div className="mt-auto border-t border-border pt-4">
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Workspace</p>
              <p className="mt-0.5 text-sm font-medium text-foreground">{teamName}</p>
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
