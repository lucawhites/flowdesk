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
  // Blu degli obiettivi: uguale in tutte le palette e leggibile sia in chiaro sia in scuro.
  info: ["#7cb3ff", "#2563eb"],
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
}: {
  icon: React.ComponentType<{ className?: string; fill?: string }>;
  label: string;
  value: number | string;
  tone?: Tone;
  /** Se presente, il riquadro è un collegamento. */
  href?: string;
}) {
  const gradientId = `stat-gradient-${tone}`;
  const [from, to] = GRADIENTS[tone];

  const card = (
    <Card className={cn("h-full", href && "transition-colors group-hover:border-primary/40")}>
      <CardContent className="flex h-full flex-col gap-1.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-[1.75rem] font-semibold leading-none tracking-tight text-foreground">
            {typeof value === "number" ? <CountUp value={value} /> : value}
          </p>
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
        <p className="text-xs leading-snug text-muted-foreground">{label}</p>
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
