"use client";

import { useEffect, useState, useTransition, type FormEvent, type KeyboardEvent } from "react";
import { Loader2, MessageSquare, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { addComment, deleteComment, listComments } from "@/app/(app)/comment-actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { addDaysISO, formatISO, romeISO, todayISO } from "@/lib/dates";
import { COMMENT_MAX, type CommentItem, type CommentTarget } from "@/lib/types";
import { cn, initials } from "@/lib/utils";

const timeFormatter = new Intl.DateTimeFormat("it-IT", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit" });

/** "oggi alle 14:32", "ieri alle 9:05", "12 nov alle 18:00" (ora italiana). */
function when(iso: string) {
  const instant = new Date(iso);
  const day = romeISO(instant);
  const today = todayISO();
  const time = timeFormatter.format(instant);
  if (day === today) return `oggi alle ${time}`;
  if (day === addDaysISO(today, -1)) return `ieri alle ${time}`;
  return `${formatISO(day, day.slice(0, 4) === today.slice(0, 4) ? "d MMM" : "d MMM yyyy")} alle ${time}`;
}

/**
 * Riquadro "Commenti" di una daily (nella finestra di dettaglio) o di un obiettivo (nella sua pagina).
 * I commenti si caricano quando il riquadro compare; ognuno può cancellare solo i propri.
 */
export function CommentsSection({ target, variant = "dialog" }: { target: CommentTarget; variant?: "dialog" | "page" }) {
  const { kind, id } = target;
  const [comments, setComments] = useState<CommentItem[] | null>(null);
  const [text, setText] = useState("");
  const [sending, startSending] = useTransition();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    listComments({ kind, id })
      .then((list) => alive && setComments(list))
      .catch(() => alive && setComments([]));
    return () => {
      alive = false;
    };
  }, [kind, id]);

  const send = (event?: FormEvent) => {
    event?.preventDefault();
    if (!text.trim() || sending) return;
    startSending(async () => {
      const result = await addComment({ kind, id }, text).catch(() => ({ error: "Commento non inviato: riprova." }));
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setComments((list) => [...(list ?? []), result.comment]);
      setText("");
    });
  };

  // Sul computer Cmd/Ctrl+Invio invia; Invio da solo va a capo.
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) send();
  };

  const remove = async (commentId: string) => {
    setConfirmId(null);
    const before = comments;
    setComments((list) => list?.filter((c) => c.id !== commentId) ?? null);
    const { ok } = await deleteComment(commentId).catch(() => ({ ok: false }));
    if (!ok) {
      setComments(before);
      toast.error("Non è stato possibile eliminare il commento");
    }
  };

  const count = comments?.length ?? 0;

  return (
    <section
      className={cn(
        "flex flex-col gap-3 text-sm",
        variant === "dialog" ? "mt-1 border-t border-border pt-3" : "rounded-xl border border-border bg-card p-4"
      )}
    >
      <h3
        className={cn(
          variant === "dialog"
            ? "text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            : "text-sm font-semibold text-muted-foreground"
        )}
      >
        Commenti{count > 0 && <span className="num"> · {count}</span>}
      </h3>

      {comments === null ? (
        <p className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Carico i commenti…
        </p>
      ) : comments.length === 0 ? (
        <p className="flex items-center gap-2 text-muted-foreground">
          <MessageSquare className="h-3.5 w-3.5" /> Ancora nessun commento
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-2.5">
              <Avatar className="mt-0.5 h-7 w-7 shrink-0">
                <AvatarFallback className="text-[0.625rem]">{initials(c.author.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-medium text-foreground">{c.author.name}</span>
                  <span className="text-xs text-muted-foreground">{when(c.createdAt)}</span>
                </div>
                <p className="mt-0.5 whitespace-pre-wrap break-words text-foreground">{c.body}</p>
              </div>
              {c.mine &&
                (confirmId === c.id ? (
                  <div className="flex shrink-0 items-start gap-1">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmId(null)}>
                      Annulla
                    </Button>
                    <Button type="button" variant="danger" size="sm" onClick={() => remove(c.id)}>
                      Elimina
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    aria-label="Elimina commento"
                    title="Elimina commento"
                    onClick={() => setConfirmId(c.id)}
                    className="-mr-1 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-foreground/5 hover:text-danger focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                ))}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={send} className="flex items-end gap-2">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Scrivi un commento…"
          aria-label="Nuovo commento"
          maxLength={COMMENT_MAX}
          rows={1}
          className="min-h-10 resize-none [field-sizing:content] max-h-40"
        />
        <Button type="submit" size="icon" className="h-10 w-10 shrink-0" disabled={!text.trim() || sending} aria-label="Invia commento">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </section>
  );
}
