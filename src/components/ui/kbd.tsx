import { cn } from "@/lib/utils";

/**
 * Tasto da premere, dentro un pulsante (es. "Salva ↵", "Annulla Esc").
 * Si vede solo con mouse o trackpad: sul telefono non c'è la tastiera fisica (classe .kbd in globals.css).
 */
export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd aria-hidden className={cn("kbd", className)}>
      {children}
    </kbd>
  );
}
