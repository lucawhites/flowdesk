import Link from "next/link";
import { Search } from "lucide-react";

/** Campo di ricerca nell'intestazione (da md in su): invia a /cerca?q=… */
export function HeaderSearch() {
  return (
    <form action="/cerca" role="search" className="relative hidden w-full max-w-xs md:block">
      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        name="q"
        type="search"
        placeholder="Cerca in daily, obiettivi, progetti"
        aria-label="Cerca"
        autoComplete="off"
        enterKeyHint="search"
        className="h-9 w-full rounded-full border border-border bg-surface-muted pr-3 pl-9 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:bg-surface focus-visible:ring-2 focus-visible:ring-ring"
      />
    </form>
  );
}

/** Lente per il telefono: porta alla pagina di ricerca. */
export function HeaderSearchLink() {
  return (
    <Link
      href="/cerca"
      aria-label="Cerca"
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-muted text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring md:hidden"
    >
      <Search className="h-4 w-4" />
    </Link>
  );
}
