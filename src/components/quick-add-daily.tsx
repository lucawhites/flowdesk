"use client";

import { useRef, useState, useTransition } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { saveDaily } from "@/app/(app)/work-actions";
import { cn } from "@/lib/utils";

/**
 * Aggiunta veloce in Home: scrivi e premi Invio, nasce una daily libera per oggi assegnata a te.
 * Obiettivo, istruzioni e il resto si aggiungono dopo dal dettaglio, se servono.
 */
export function QuickAddDaily({ userId, today }: { userId: string; today: string }) {
  const [title, setTitle] = useState("");
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function submit() {
    const text = title.trim();
    if (!text || pending) return;
    const fd = new FormData();
    fd.set("title", text);
    fd.set("date", today);
    fd.set("assigneeId", userId);
    fd.set("objectiveId", "NONE");
    startTransition(async () => {
      const result = await saveDaily(null, undefined, fd);
      if (result?.errors || result?.message) {
        toast.error(result.message ?? result.errors?.title?.[0] ?? "Daily non salvata");
        return;
      }
      setTitle("");
      toast.success("Daily aggiunta per oggi");
      inputRef.current?.focus();
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className={cn(
        "flex h-12 items-center gap-2.5 rounded-xl border border-dashed border-border bg-card px-3.5 transition-colors focus-within:border-solid focus-within:border-ring",
      )}
    >
      {pending ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
      ) : (
        <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
      )}
      <input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Aggiungi una daily per oggi…"
        aria-label="Nuova daily per oggi"
        maxLength={140}
        enterKeyHint="done"
        autoComplete="off"
        className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
      />
      {title.trim() && (
        <button type="submit" disabled={pending} className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-accent hover:bg-accent-soft">
          Aggiungi
        </button>
      )}
    </form>
  );
}
