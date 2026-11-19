"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

// Sul telefono (sotto i 640px) la finestra è un foglio che sale dal basso, come su iPhone:
// la maniglia resta sempre visibile in alto; si chiude trascinandolo giù dalla maniglia
// (sempre) o dal contenuto (quando è scorso fino in cima).
// Da 640px in su resta la finestra centrata.
const SHEET_CLOSE_PX = 110;
const SHEET_MS = 260;
const SHEET_EASE = "cubic-bezier(0.32, 0.72, 0, 1)";

// `el` (il foglio) e `scroller` (la parte che scorre) arrivano da ref a callback:
// esistono solo quando la finestra è aperta.
function useSheetDrag(
  el: HTMLDivElement | null,
  scroller: HTMLDivElement | null,
  closeRef: React.RefObject<HTMLButtonElement | null>
) {
  React.useEffect(() => {
    if (!el || !scroller) return;
    // Dalla maniglia si trascina sempre; dal contenuto solo quando è scorso fino in cima.
    const atTop = (target: HTMLElement) => !!target.closest("[data-sheet-handle]") || scroller.scrollTop <= 0;
    const phone = window.matchMedia("(max-width: 639px)");
    let start: { y: number; x: number; t: number; locked: boolean } | null = null;
    let dy = 0;

    const onStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (!phone.matches || e.touches.length !== 1 || !atTop(target)) return;
      if (target.closest("input, textarea, select, [role='listbox'], [role='menu']")) return;
      start = { y: e.touches[0].clientY, x: e.touches[0].clientX, t: e.timeStamp, locked: false };
      dy = 0;
    };
    const onMove = (e: TouchEvent) => {
      if (!start) return;
      const my = e.touches[0].clientY - start.y;
      const mx = e.touches[0].clientX - start.x;
      if (!start.locked) {
        if (Math.abs(my) < 8 && Math.abs(mx) < 8) return;
        if (my <= 0 || Math.abs(mx) > my || !atTop(e.target as HTMLElement)) {
          start = null;
          return;
        }
        start.locked = true;
        el.style.transition = "none";
        el.style.animation = "none";
      }
      e.preventDefault();
      dy = Math.max(0, my);
      el.style.transform = `translateY(${dy}px)`;
    };
    const onEnd = (e: TouchEvent) => {
      if (!start?.locked) {
        start = null;
        return;
      }
      const velocity = dy / Math.max(1, e.timeStamp - start.t);
      start = null;
      el.style.transition = `transform ${SHEET_MS}ms ${SHEET_EASE}`;
      if (dy > SHEET_CLOSE_PX || velocity > 0.6) {
        el.style.transform = "translateY(100%)";
        window.setTimeout(() => closeRef.current?.click(), SHEET_MS - 40);
      } else {
        el.style.transform = "";
      }
    };

    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd);
    el.addEventListener("touchcancel", onEnd);
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onEnd);
    };
  }, [el, scroller, closeRef]);
}

// Telefono con la tastiera aperta: iOS la mette sopra la pagina senza spostare gli elementi fissi,
// quindi il foglio finirebbe dietro. Qui il foglio si appoggia sopra la tastiera (visualViewport)
// e il campo toccato viene portato in vista.
function useKeyboardAware(el: HTMLDivElement | null) {
  React.useEffect(() => {
    const vv = window.visualViewport;
    if (!el || !vv) return;
    const sheet: HTMLDivElement = el;
    const phone = window.matchMedia("(max-width: 639px)");

    const update = () => {
      if (!phone.matches) return;
      const keyboard = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      if (keyboard > 80) {
        sheet.style.setProperty("bottom", `${keyboard}px`);
        sheet.style.setProperty("max-height", `${vv.height - 12}px`);
        sheet.setAttribute("data-keyboard", "open");
      } else {
        sheet.style.removeProperty("bottom");
        sheet.style.removeProperty("max-height");
        sheet.removeAttribute("data-keyboard");
      }
    };
    const onFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (!phone.matches || !target.matches("input, textarea, select, [contenteditable='true']")) return;
      // Dopo che la tastiera è salita.
      window.setTimeout(() => target.scrollIntoView({ block: "center", behavior: "smooth" }), 320);
    };

    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    sheet.addEventListener("focusin", onFocus);
    update();
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      sheet.removeEventListener("focusin", onFocus);
    };
  }, [el]);
}

export function DialogContent({
  className,
  children,
  onOpenAutoFocus,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>) {
  const [contentEl, setContentEl] = React.useState<HTMLDivElement | null>(null);
  const [scrollEl, setScrollEl] = React.useState<HTMLDivElement | null>(null);
  const closeRef = React.useRef<HTMLButtonElement>(null);
  useSheetDrag(contentEl, scrollEl, closeRef);
  useKeyboardAware(contentEl);

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="dialog-overlay fixed inset-0 z-50 bg-black/30 backdrop-blur-[3px]" />
      <DialogPrimitive.Content
        ref={setContentEl}
        className={cn(
          // Telefono: foglio dal basso, a tutta larghezza. Maniglia e X restano ferme in alto,
          // scorre solo il contenuto sotto.
          "dialog-content fixed inset-x-0 bottom-0 z-50 flex max-h-[calc(100dvh-3rem)] w-full flex-col overflow-hidden glass rounded-t-3xl border-t border-border/70 shadow-lg outline-none",
          // Da 640px: finestra centrata.
          "sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-h-[calc(100dvh-2rem)] sm:w-[calc(100%-2rem)] sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border",
          className
        )}
        {...props}
        onOpenAutoFocus={(event) => {
          onOpenAutoFocus?.(event);
          // Sugli schermi touch nessun campo prende il cursore da solo: la tastiera si apre
          // solo quando tocchi un campo, così il foglio si vede tutto.
          if (!event.defaultPrevented && window.matchMedia("(pointer: coarse)").matches) {
            event.preventDefault();
            contentEl?.focus({ preventScroll: true });
          }
        }}
      >
        <div data-sheet-handle aria-hidden className="flex h-7 shrink-0 items-start justify-center pt-2 sm:hidden">
          <span className="h-1.5 w-10 rounded-full bg-foreground/20" />
        </div>
        <div
          ref={setScrollEl}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))] in-data-[keyboard=open]:pb-4 sm:p-6"
        >
          {children}
        </div>
        <DialogPrimitive.Close
          ref={closeRef}
          className="absolute right-4 top-5 rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer sm:top-4"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Chiudi</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4 flex flex-col gap-1", className)} {...props} />;
}

export function DialogTitle({ className, ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn("text-lg font-semibold text-foreground", className)} {...props} />;
}

export function DialogDescription({ className, ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-6 flex justify-end gap-2", className)} {...props} />;
}
