"use client";

import { useState, useSyncExternalStore } from "react";
import { Moon, Sun, SunMoon } from "lucide-react";
import { cn } from "@/lib/utils";
import { applyThemeChoice, readThemeChoice, type ThemeChoice as Choice } from "@/lib/theme-color";

/**
 * Interruttore chiaro/scuro in stile iPhone (intestazione su computer). Lo stato vive in <html data-theme>.
 * Binario spento grigio semitrasparente (come iOS): resta visibile anche sul vetro del menù.
 */
export function ThemeToggle({ className }: { className?: string }) {
  function toggle() {
    applyThemeChoice(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Cambia tema chiaro/scuro"
      title="Tema chiaro/scuro"
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full bg-foreground/15 transition-colors duration-200 dark:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
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

const noopSubscribe = () => () => {};

const CHOICES: { value: Choice; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Chiaro", icon: Sun },
  { value: "dark", label: "Scuro", icon: Moon },
  { value: "auto", label: "Automatico", icon: SunMoon },
];

/** Scelta del tema nel menù del telefono: Chiaro, Scuro o Automatico (segue l'iPhone). */
export function ThemeChoice() {
  // Scelta salvata sul dispositivo (null durante il rendering sul server), poi quella toccata.
  const stored = useSyncExternalStore(noopSubscribe, readThemeChoice, () => null);
  const [picked, setChoice] = useState<Choice | null>(null);
  const choice = picked ?? stored;

  return (
    <div role="radiogroup" aria-label="Tema" className="grid grid-cols-3 gap-1 rounded-xl bg-foreground/10 p-1">
      {CHOICES.map(({ value, label, icon: Icon }) => {
        const active = choice === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => {
              applyThemeChoice(value);
              setChoice(value);
            }}
            className={cn(
              "flex cursor-pointer flex-col items-center gap-1 rounded-lg py-2 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
              active ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground"
            )}
          >
            <Icon className={cn("h-4 w-4", active && "text-accent")} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
