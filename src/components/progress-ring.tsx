import { Check } from "lucide-react";

// Anello di avanzamento delle daily (stesso disegno dell'icona di Flowdesk):
// un arco arancio sfumato che si riempie; a lavoro finito diventa verde con la spunta.
// L'arco si disegna una volta all'apertura (animazione in globals.css, ferma con "Riduci movimento").
// `id` serve a rendere unico il gradiente quando ci sono più anelli nella pagina.
export function ProgressRing({
  id,
  done,
  total,
  size = 84,
  strokeWidth = 9,
}: {
  id: string;
  done: number;
  total: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const fraction = total > 0 ? Math.min(1, done / total) : 0;
  const complete = total > 0 && done >= total;
  const length = fraction * circumference;
  const gradientId = `ring-${id}`;

  return (
    <div className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--accent-light)" />
            <stop offset="1" stopColor="var(--accent)" />
          </linearGradient>
        </defs>
        <circle cx={center} cy={center} r={radius} fill="none" stroke="var(--surface-muted)" strokeWidth={strokeWidth} />
        {length > 0 && (
          <circle
            className="progress-ring-arc"
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={complete ? "var(--success)" : `url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${length} ${circumference}`}
            style={{ "--ring-length": `${length}px` } as React.CSSProperties}
          />
        )}
      </svg>
      <span className="absolute inset-0 flex items-center justify-center">
        {complete ? (
          <Check className="h-6 w-6 text-success" strokeWidth={3} />
        ) : (
          <span className="text-base font-semibold text-foreground">
            {total > 0 ? `${Math.round(fraction * 100)}%` : "–"}
          </span>
        )}
      </span>
    </div>
  );
}
