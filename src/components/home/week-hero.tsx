import Link from "next/link";
import { ProgressRing } from "@/components/progress-ring";

export type HeroPerson = { id: string; name: string; done: number; total: number };

/** Iniziali per il cerchietto della persona (Luca Bianchi → LB). */
function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

/**
 * Scheda grande della Home: com'è andata la settimana del team. Frase, tre numeri e l'anello
 * con le persone del team intorno (ognuna col suo «fatte / totali» della settimana).
 * Fondo con una velatura dell'accento della palette, leggibile in tutte le palette e nei due temi.
 */
export function WeekHero({
  done,
  total,
  headline,
  stats,
  people,
}: {
  done: number;
  total: number;
  headline: string;
  stats: { value: number | string; label: string }[];
  people: HeroPerson[];
}) {
  const size = 132;
  const orbit = size / 2 + 6;
  return (
    <Link
      href="/team"
      className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm outline-none transition-colors hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring"
      style={{ backgroundImage: "linear-gradient(135deg, color-mix(in srgb, var(--accent-soft) 85%, transparent), transparent 70%)" }}
    >
      <div className="flex flex-col gap-6 p-5 sm:flex-row sm:items-center sm:p-6">
        <div className="min-w-0 flex-1">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-card/70 px-2.5 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden /> La settimana del team
          </p>
          <div className="mt-3 flex items-center gap-4">
            <h2 className="min-w-0 flex-1 text-lg font-semibold leading-snug tracking-tight text-foreground sm:text-2xl">{headline}</h2>
            {/* Sul telefono: anello piccolo accanto al titolo, senza le persone intorno. */}
            <div className="sm:hidden">
              <ProgressRing id="week-hero-sm" done={done} total={total} size={72} strokeWidth={8} />
            </div>
          </div>
          <dl className="mt-4 grid grid-cols-3 gap-3 sm:max-w-md">
            {stats.map((s) => (
              <div key={s.label} className="border-l border-border pl-3 first:border-l-0 first:pl-0">
                <dt className="sr-only">{s.label}</dt>
                <dd className="text-xl font-semibold tabular-nums text-foreground">{s.value}</dd>
                <p className="text-xs leading-snug text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative mx-auto hidden shrink-0 sm:block" style={{ width: size + 44, height: size + 44 }}>
          <div className="absolute" style={{ left: 22, top: 22 }}>
            <ProgressRing id="week-hero" done={done} total={total} size={size} strokeWidth={11} />
          </div>
          {people.map((p, i) => {
            // Persone in cerchio, a partire da in alto a destra.
            const angle = -Math.PI / 3 + (i * 2 * Math.PI) / Math.max(people.length, 1);
            const x = (size + 44) / 2 + Math.cos(angle) * orbit;
            const y = (size + 44) / 2 + Math.sin(angle) * orbit;
            return (
              <span
                key={p.id}
                title={`${p.name}: ${p.done} di ${p.total} daily fatte questa settimana`}
                className="absolute flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[var(--card)] bg-primary-soft text-[0.6875rem] font-semibold text-foreground shadow-sm"
                style={{ left: x, top: y }}
              >
                {initials(p.name)}
              </span>
            );
          })}
        </div>
      </div>
    </Link>
  );
}
