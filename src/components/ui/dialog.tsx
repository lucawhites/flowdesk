"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

// Sul telefono (sotto i 640px) la finestra è un foglio che sale dal basso, come su iPhone:
// si chiude trascinandolo giù dalla maniglia o dal bordo alto (quando il contenuto è in cima).
// Da 640px in su resta la finestra centrata.
const SHEET_CLOSE_PX = 110;
const SHEET_MS = 260;
const SHEET_EASE = "cubic-bezier(0.32, 0.72, 0, 1)";

// `el` arriva da una ref a callback: il contenuto esiste solo quando la finestra è aperta.
function useSheetDrag(el: HTMLDivElement | null, closeRef: React.RefObject<HTMLButtonElement | null>) {
  React.useEffect(() => {
    if (!el) return;
    const phone = window.matchMedia("(max-width: 639px)");
    let start: { y: number; x: number; t: number; locked: boolean } | null = null;
    let dy = 0;

    const onStart = (e: TouchEvent) => {
      if (!phone.matches || e.touches.length !== 1 || el.scrollTop > 0) return;
      const target = e.target as HTMLElement;
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
        if (my <= 0 || Math.abs(mx) > my || el.scrollTop > 0) {
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
  }, [el, closeRef]);
}

export function DialogContent({ className, children, ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>) {
  const [contentEl, setContentEl] = React.useState<HTMLDivElement | null>(null);
  const closeRef = React.useRef<HTMLButtonElement>(null);
  useSheetDrag(contentEl, closeRef);

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="dialog-overlay fixed inset-0 z-50 bg-black/30 backdrop-blur-[3px]" />
      <DialogPrimitive.Content
        ref={setContentEl}
        className={cn(
          // Telefono: foglio dal basso, a tutta larghezza, sopra la barra di sistema.
          "dialog-content fixed inset-x-0 bottom-0 z-50 max-h-[calc(100dvh-3rem)] w-full overflow-y-auto overscroll-contain glass rounded-t-3xl border-t border-border/70 px-5 pt-7 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-lg outline-none",
          // Da 640px: finestra centrata.
          "sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-h-[calc(100dvh-2rem)] sm:w-[calc(100%-2rem)] sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border sm:p-6",
          className
        )}
        {...props}
      >
        <div aria-hidden className="absolute left-1/2 top-2 h-1.5 w-10 -translate-x-1/2 rounded-full bg-foreground/20 sm:hidden" />
        {children}
        <DialogPrimitive.Close
          ref={closeRef}
          className="absolute right-4 top-4 rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
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
