"use client";

import { useState } from "react";
import Link from "next/link";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { SidebarNav } from "@/components/sidebar-nav";

/** Menù a scomparsa da sinistra (pulsante ☰ nell'intestazione), solo su schermi piccoli. */
export function MobileNav({ teamName }: { teamName?: string | null }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger
        aria-label="Apri il menù"
        className="-ml-1.5 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-foreground outline-none transition-colors hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-ring active:bg-surface-muted md:hidden"
      >
        <Menu className="h-5 w-5" />
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="dialog-overlay fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] md:hidden" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="drawer-content fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-border bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-[calc(1.25rem+env(safe-area-inset-top))] shadow-lg outline-none md:hidden"
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
