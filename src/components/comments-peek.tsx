"use client";

import { useState, type ReactNode } from "react";
import * as HoverCard from "@radix-ui/react-hover-card";
import { Loader2 } from "lucide-react";
import { listComments } from "@/app/(app)/comment-actions";
import type { CommentItem, CommentTarget } from "@/lib/types";

/** Quanti commenti mostrare nell'anteprima (gli ultimi). */
const PEEK_MAX = 3;

const when = (iso: string) =>
  new Date(iso).toLocaleString("it-IT", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Rome",
  });

/**
 * Anteprima dei commenti al passaggio del mouse (solo da computer: Radix HoverCard
 * ignora il tocco). I commenti si caricano alla prima apertura e si ricaricano
 * quando cambia il numero.
 */
export function CommentsPeek({ target, count, children }: { target: CommentTarget; count: number; children: ReactNode }) {
  const [loaded, setLoaded] = useState<{ count: number; items: CommentItem[] } | null>(null);
  const fresh = loaded && loaded.count === count ? loaded.items : null;

  const onOpenChange = (open: boolean) => {
    if (!open || fresh) return;
    listComments(target).then((items) => setLoaded({ count, items }));
  };

  const shown = fresh ? fresh.slice(-PEEK_MAX) : [];
  const hidden = fresh ? fresh.length - shown.length : 0;

  return (
    <HoverCard.Root openDelay={250} closeDelay={120} onOpenChange={onOpenChange}>
      <HoverCard.Trigger asChild>{children}</HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content
          side="bottom"
          align="start"
          sideOffset={6}
          collisionPadding={12}
          className="popover-content z-50 w-80 max-w-[calc(100vw-1.5rem)] glass rounded-xl border border-border/70 p-3 text-sm shadow-lg"
        >
          {!fresh ? (
            <p className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Carico i commenti…
            </p>
          ) : shown.length === 0 ? (
            <p className="text-muted-foreground">Nessun commento</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {hidden > 0 && (
                <li className="text-xs text-muted-foreground">
                  {hidden === 1 ? "1 commento precedente" : `${hidden} commenti precedenti`}
                </li>
              )}
              {shown.map((c) => (
                <li key={c.id} className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{c.author.name}</span> · <span className="num">{when(c.createdAt)}</span>
                  </span>
                  <p className="line-clamp-4 whitespace-pre-wrap text-foreground">{c.body}</p>
                </li>
              ))}
            </ul>
          )}
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  );
}
