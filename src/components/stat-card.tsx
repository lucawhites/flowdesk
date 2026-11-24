import Link from "next/link";
import { CountUp } from "@/components/count-up";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "primary" | "success" | "danger" | "warning" | "info";

// Sfumatura delle icone (dal chiaro in alto al colore pieno in basso), come le icone di iPhone.
// I colori seguono palette e tema chiaro/scuro perché sono variabili CSS.
const GRADIENTS: Record<Tone, [string, string]> = {
  primary: ["var(--accent-light)", "var(--accent)"],
  success: ["color-mix(in srgb, var(--success) 55%, #ffffff)", "var(--success)"],
  warning: ["color-mix(in srgb, var(--warning) 50%, #ffffff)", "var(--warning)"],
  danger: ["color-mix(in srgb, var(--danger) 55%, #ffffff)", "var(--danger)"],
  neutral: ["var(--muted-foreground)", "var(--foreground)"],
  // Blu degli obiettivi: lo stesso in quasi tutte le palette (la palette Elitter usa il suo blu).
  info: ["var(--info-from)", "var(--info-to)"],
};

/**
 * Scheda numerica in stile widget iPhone: numero grande in alto a sinistra, icona piena e
 * sfumata in alto a destra, descrizione sotto.
 */
export function StatCard({
  icon: Icon,
  label,
  value,
  tone = "neutral",
  href,
  trend,
  delta,
}: {
  icon: React.ComponentType<{ className?: string; fill?: string }>;
  label: string;
  value: number | string;
  tone?: Tone;
  /** Se presente, il riquadro è un collegamento. */
  href?: string;
  /** Andamento degli ultimi giorni (dal più vecchio a oggi): disegna una piccola linea. */
  trend?: number[];
  /** Variazione in % rispetto al periodo prima; null = non confrontabile. */
  delta?: number | null;
}) {
  const gradientId = `stat-gradient-${tone}`;
  const [from, to] = GRADIENTS[tone];

  const card = (
    <Card className={cn("h-full", href && "transition-colors group-hover:border-primary/40")}>
      <CardContent className="flex h-full flex-col gap-1.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-baseline gap-1.5">
            <p className="truncate text-[1.75rem] font-semibold leading-none tracking-tight text-foreground">
              {typeof value === "number" ? <CountUp value={value} /> : value}
            </p>
            {delta != null && (
              <span
                title="Rispetto ai 7 giorni prima"
                className={cn(
                  "shrink-0 rounded-full px-1.5 py-0.5 text-[0.625rem] font-semibold tabular-nums",
                  delta >= 0 ? "bg-success-soft text-success" : "bg-danger-soft text-danger"
                )}
              >
                {delta > 0 ? "+" : ""}
                {delta}%
              </span>
            )}
          </div>
          <svg width="0" height="0" className="absolute" aria-hidden>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" style={{ stopColor: from }} />
                <stop offset="1" style={{ stopColor: to }} />
              </linearGradient>
            </defs>
          </svg>
          <Icon className="h-7 w-7 shrink-0" fill={`url(#${gradientId})`} />
        </div>
        <div className="mt-auto flex items-end justify-between gap-2">
          <p className="text-xs leading-snug text-muted-foreground">{label}</p>
          {trend && trend.length > 1 && <Sparkline values={trend} color={to} />}
        </div>

      </CardContent>
    </Card>
  );

  if (!href) return card;
  return (
    <Link href={href} className="group rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {card}
    </Link>
  );
}

/** Piccola linea dell'andamento, con un punto sull'ultimo valore (oggi). */
function Sparkline({ values, color }: { values: number[]; color: string }) {
  const w = 56;
  const h = 20;
  const max = Math.max(...values, 1);
  const step = w / (values.length - 1);
  const points = values.map((v, i) => [i * step, h - 2 - (v / max) * (h - 4)] as const);
  const d = points.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const [lx, ly] = points[points.length - 1]!;
  return (
    <svg width={w} height={h} viewBox={`-2 0 ${w + 4} ${h}`} aria-hidden className="shrink-0 overflow-visible">
      <path d={d} fill="none" style={{ stroke: color }} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
      <circle cx={lx} cy={ly} r="2.2" style={{ fill: color }} />
    </svg>
  );
}
