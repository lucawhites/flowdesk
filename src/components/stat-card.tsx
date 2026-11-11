import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  icon: Icon,
  label,
  value,
  tone = "neutral",
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  tone?: "neutral" | "primary" | "success" | "danger" | "warning";
  /** Se presente, il riquadro è un collegamento. */
  href?: string;
}) {
  const toneClass = {
    neutral: "bg-surface-muted text-muted-foreground",
    primary: "bg-accent-soft text-accent",
    success: "bg-success-soft text-success",
    danger: "bg-danger-soft text-danger",
    warning: "bg-warning-soft text-warning",
  }[tone];

  const card = (
    <Card className={cn(href && "h-full transition-colors group-hover:border-primary/40")}>
      <CardContent className="flex items-center gap-3 p-4">
        <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", toneClass)}>
          <Icon className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold leading-tight text-foreground">{value}</p>
          <p className="text-xs leading-snug text-muted-foreground">{label}</p>
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
