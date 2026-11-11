"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

/** Interruttore chiaro/scuro in stile iPhone. Lo stato vive in <html data-theme>. */
export function ThemeToggle({ className }: { className?: string }) {
  function toggle() {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Navigazione privata: il tema vale solo per questa visita.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Cambia tema chiaro/scuro"
      title="Tema chiaro/scuro"
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full bg-surface-muted transition-colors duration-200 dark:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
    >
      <span className="absolute left-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-surface text-muted-foreground shadow-sm transition-transform duration-200 dark:translate-x-5 dark:text-accent">
        <Sun className="h-3.5 w-3.5 dark:hidden" />
        <Moon className="hidden h-3.5 w-3.5 dark:block" />
      </span>
    </button>
  );
}
