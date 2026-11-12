// Senza "use client": usato da Server Component, non riceve funzioni.

const SNIPPET_AROUND = 60;

/**
 * Mostra il testo evidenziando la parola cercata (senza distinguere maiuscole).
 * Con `snippet` accorcia i testi lunghi attorno alla prima occorrenza.
 */
export function Highlight({ text, query, snippet = false }: { text: string; query: string; snippet?: boolean }) {
  const q = query.trim().toLowerCase();
  let shown = text;
  if (snippet && q) {
    const at = text.toLowerCase().indexOf(q);
    if (at >= 0 && text.length > SNIPPET_AROUND * 2 + q.length) {
      const start = Math.max(0, at - SNIPPET_AROUND);
      const end = Math.min(text.length, at + q.length + SNIPPET_AROUND);
      shown = `${start > 0 ? "…" : ""}${text.slice(start, end)}${end < text.length ? "…" : ""}`;
    }
  }
  if (!q) return <>{shown}</>;

  const parts: React.ReactNode[] = [];
  const lower = shown.toLowerCase();
  let from = 0;
  for (let at = lower.indexOf(q); at >= 0; at = lower.indexOf(q, from)) {
    if (at > from) parts.push(shown.slice(from, at));
    parts.push(
      <mark key={at} className="rounded-sm bg-accent-soft px-0.5 text-foreground">
        {shown.slice(at, at + q.length)}
      </mark>,
    );
    from = at + q.length;
  }
  parts.push(shown.slice(from));
  return <>{parts}</>;
}
