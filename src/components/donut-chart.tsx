type Segment = {
  label: string;
  value: number;
  colorVar: string; // CSS variable name, e.g. "--primary"
};

export function DonutChart({
  segments,
  size = 120,
  strokeWidth = 16,
  centerLabel,
  centerSublabel,
}: {
  segments: Segment[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerSublabel?: string;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let offset = 0;
  const arcs = segments.map((segment) => {
    const fraction = total > 0 ? segment.value / total : 0;
    const dash = fraction * circumference;
    const arc = (
      <circle
        key={segment.label}
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={`var(${segment.colorVar})`}
        strokeWidth={strokeWidth}
        strokeDasharray={`${dash} ${circumference - dash}`}
        strokeDashoffset={-offset}
        strokeLinecap={dash > 0 && dash < circumference ? "butt" : "round"}
      />
    );
    offset += dash;
    return arc;
  });

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={center} cy={center} r={radius} fill="none" stroke="var(--surface-muted)" strokeWidth={strokeWidth} />
        {total > 0 && arcs}
      </svg>
      {(centerLabel || centerSublabel) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {centerLabel && <span className="text-lg font-semibold text-foreground">{centerLabel}</span>}
          {centerSublabel && <span className="text-[10px] text-muted-foreground">{centerSublabel}</span>}
        </div>
      )}
    </div>
  );
}

export function DonutLegend({ segments }: { segments: Segment[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      {segments.map((segment) => (
        <div key={segment.label} className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: `var(${segment.colorVar})` }} />
          <span className="flex-1">{segment.label}</span>
          <span className="font-medium text-foreground">{segment.value}</span>
        </div>
      ))}
    </div>
  );
}
