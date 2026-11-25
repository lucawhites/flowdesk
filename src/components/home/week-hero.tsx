import Link from "next/link";
import { ProgressRing } from "@/components/progress-ring";
import { cn } from "@/lib/utils";

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
 * a spicchi: uno spicchio per persona, riempito con le sue daily fatte della settimana.
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

        <div className="mx-auto hidden shrink-0 sm:block">
          <TeamRing done={done} total={total} people={people} />
        </div>
      </div>
    </Link>
  );
}

/** Punto sulla circonferenza: angolo in gradi, 0 = in alto, senso orario. */
function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)] as const;
}

function arc(cx: number, cy: number, r: number, from: number, to: number) {
  const [x1, y1] = polar(cx, cy, r, from);
  const [x2, y2] = polar(cx, cy, r, to);
  return `M${x1.toFixed(2)} ${y1.toFixed(2)} A${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

/**
 * Anello del team: ogni persona ha lo stesso spicchio (così nessuno «vince» per posizione)
 * riempito in proporzione alle SUE daily fatte; verde quando le ha fatte tutte. Le iniziali
 * stanno a metà del proprio spicchio, con «fatte/totali» sotto. Al centro la % del team.
 */
function TeamRing({ done, total, people }: { done: number; total: number; people: HeroPerson[] }) {
  const ring = 128;
  const stroke = 11;
  // Spazio intorno all'anello: largo ai lati (i numeri stanno accanto alle iniziali, verso
  // l'esterno), meno in alto e in basso.
  const width = ring + 172;
  const height = ring + 108;
  const cx = width / 2;
  const cy = height / 2;
  const r = (ring - stroke) / 2;
  const active = people.filter((p) => p.total > 0);
  const n = Math.max(active.length, 1);
  const span = 360 / n;
  const gap = active.length > 1 ? 16 : 0; // spazio tra gli spicchi (compresi i bordi arrotondati)
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="relative" style={{ width, height }}>
      <svg width={width} height={height} aria-hidden>
        <defs>
          <linearGradient id="team-ring-fill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" style={{ stopColor: "var(--accent-light)" }} />
            <stop offset="1" style={{ stopColor: "var(--accent)" }} />
          </linearGradient>
        </defs>
        {active.length === 0 && (
          <circle cx={cx} cy={cy} r={r} fill="none" style={{ stroke: "var(--surface-muted)" }} strokeWidth={stroke} />
        )}
        {active.map((p, i) => {
          const from = i * span + gap / 2;
          const to = (i + 1) * span - gap / 2;
          const fill = p.done / p.total;
          const complete = p.done >= p.total;
          return (
            <g key={p.id}>
              <path d={arc(cx, cy, r, from, to)} fill="none" style={{ stroke: "var(--surface-muted)" }} strokeWidth={stroke} strokeLinecap="round" />
              {fill > 0 && (
                <path
                  d={arc(cx, cy, r, from, from + Math.max(fill * (to - from), 0.5))}
                  fill="none"
                  style={{ stroke: complete ? "var(--success)" : "url(#team-ring-fill)" }}
                  strokeWidth={stroke}
                  strokeLinecap="round"
                />
              )}
            </g>
          );
        })}
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-semibold tabular-nums text-foreground">{total > 0 ? `${percent}%` : "–"}</span>
        <span className="text-[0.625rem] font-medium uppercase tracking-wider text-muted-foreground">team</span>
      </span>
      {active.map((p, i) => {
        const [x, y] = polar(cx, cy, r + stroke / 2 + 20, (i + 0.5) * span);
        // I numeri vanno verso l'esterno: a sinistra, a destra o sotto (se la persona è in basso/in alto al centro).
        const side = Math.abs(x - cx) < 12 ? (y > cy ? "below" : "above") : x < cx ? "left" : "right";
        return (
          <span
            key={p.id}
            title={`${p.name}: ${p.done} di ${p.total} daily fatte questa settimana`}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: x, top: y }}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[var(--card)] bg-primary-soft text-[0.6875rem] font-semibold text-foreground shadow-sm">
              {initials(p.name)}
            </span>
            <span
              className={cn(
                "absolute whitespace-nowrap text-[0.6875rem] font-semibold tabular-nums text-muted-foreground",
                side === "left" && "right-full top-1/2 mr-1.5 -translate-y-1/2",
                side === "right" && "left-full top-1/2 ml-1.5 -translate-y-1/2",
                side === "below" && "left-1/2 top-full mt-0.5 -translate-x-1/2",
                side === "above" && "bottom-full left-1/2 mb-0.5 -translate-x-1/2"
              )}
            >
              {p.done}/{p.total}
            </span>
          </span>
        );
      })}
    </div>
  );
}
