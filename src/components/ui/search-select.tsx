"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type SearchOption = {
  value: string;
  label: string;
  /** Riga piccola sotto (es. il progetto); entra anche nella ricerca. */
  hint?: string;
};

/** Minuscole e senza accenti, così «perche» trova «perché». */
function norm(text: string) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/**
 * Scelta da un elenco lungo con ricerca per parola chiave. Si apre sotto il campo (non in una
 * finestra sopra), così funziona anche dentro le finestre e i fogli del telefono. Tutte le
 * parole scritte devono comparire nel nome o nella riga sotto, in qualsiasi ordine.
 * Il valore va nel form con un campo nascosto `name`.
 */
export function SearchSelect({
  id,
  name,
  value,
  onChange,
  options,
  emptyOption,
  placeholder = "Cerca…",
  noResults = "Nessun risultato",
}: {
  id?: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: SearchOption[];
  /** Voce fissa in cima, sempre visibile (es. «Nessuno»). */
  emptyOption?: SearchOption;
  placeholder?: string;
  /** Testo quando la ricerca non trova niente; segue la parola cercata. */
  noResults?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const all = useMemo(() => (emptyOption ? [emptyOption, ...options] : options), [emptyOption, options]);
  const selected = all.find((o) => o.value === value);

  const results = useMemo(() => {
    const words = norm(query).split(/\s+/).filter(Boolean);
    if (!words.length) return all;
    const found = options.filter((o) => {
      const text = norm(`${o.label} ${o.hint ?? ""}`);
      return words.every((w) => text.includes(w));
    });
    return emptyOption ? [emptyOption, ...found] : found;
  }, [query, all, options, emptyOption]);

  function close() {
    setOpen(false);
    setQuery("");
  }

  function pick(option: SearchOption) {
    onChange(option.value);
    close();
  }

  // Chiude toccando fuori.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  // Esc chiude solo la ricerca, non la finestra: ascolto su window in cattura, che arriva
  // prima dell'ascoltatore della finestra (Radix) sul documento.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      e.preventDefault();
      close();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Tiene in vista la voce evidenziata con le frecce.
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      // Invio sceglie la voce evidenziata e non invia il form (⌘ Invio resta «Salva»).
      if (e.metaKey || e.ctrlKey) return;
      e.preventDefault();
      const option = results[active];
      if (option) pick(option);
    }
  }

  return (
    <div ref={rootRef} className="flex flex-col gap-1.5">
      <input type="hidden" name={name} value={value} />
      {open ? (
        <div className="flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-3 ring-2 ring-ring">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            id={id}
            type="text"
            role="combobox"
            aria-expanded
            aria-controls={listId}
            aria-activedescendant={results[active] ? `${listId}-${active}` : undefined}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              // con una ricerca, evidenzia il primo risultato vero (non «Nessuno»)
              setActive(e.target.value.trim() && emptyOption ? 1 : 0);
            }}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={close}
            aria-label="Chiudi la ricerca"
            className="-mr-1 rounded-md p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          id={id}
          onClick={() => {
            setActive(Math.max(0, all.findIndex((o) => o.value === value)));
            setOpen(true);
          }}
          className="flex h-10 w-full min-w-0 cursor-pointer items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 text-left text-sm text-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="min-w-0 flex-1 truncate">
            {selected ? (selected.hint ? `${selected.hint} · ${selected.label}` : selected.label) : placeholder}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      )}

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          className="max-h-64 overflow-y-auto overscroll-contain rounded-xl border border-border bg-surface p-1 shadow-sm"
        >
          {results.map((o, i) => (
            <li
              key={o.value}
              id={`${listId}-${i}`}
              data-index={i}
              role="option"
              aria-selected={o.value === value}
              onPointerMove={() => setActive(i)}
              onClick={() => pick(o)}
              className={cn(
                "relative flex cursor-pointer select-none flex-col rounded-lg py-2 pl-8 pr-3 text-sm",
                i === active && "bg-foreground/[0.06]"
              )}
            >
              {o.value === value && <Check className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-accent" />}
              <span className="text-foreground">{o.label}</span>
              {o.hint && <span className="text-xs text-muted-foreground">{o.hint}</span>}
            </li>
          ))}
          {results.length === (emptyOption ? 1 : 0) && (
            <li className="px-3 py-3 text-center text-sm text-muted-foreground">{noResults} con «{query.trim()}»</li>
          )}
        </ul>
      )}
    </div>
  );
}
