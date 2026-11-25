import { addDaysISO, formatISO } from "@/lib/dates";
import { cn } from "@/lib/utils";

/**
 * Riga della settimana nel riquadro «In calendario»: data grande di oggi, poi i giorni da lunedì
 * a domenica con un pallino sotto quelli che hanno eventi (arancio; giallo se c'è un'assenza).
 */
export function WeekStrip({
  today,
  monday,
  marks,
}: {
  today: string;
  monday: string;
  /** Giorno ISO → "event" | "absence". */
  marks: Record<string, "event" | "absence">;
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDaysISO(monday, i));
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-semibold leading-none tracking-tight text-accent">{formatISO(today, "d")}</span>
        <span className="text-sm font-medium capitalize text-foreground">{formatISO(today, "EEEE")}</span>
        <span className="text-sm text-muted-foreground">{formatISO(today, "MMMM")}</span>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const isToday = d === today;
          const mark = marks[d];
          return (
            <div
              key={d}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-lg py-1.5",
                isToday ? "bg-accent text-on-accent" : "text-foreground",
                d < today && !isToday && "opacity-50"
              )}
            >
              <span className={cn("text-[0.625rem] font-semibold uppercase", isToday ? "opacity-75" : "text-muted-foreground")}>
                {formatISO(d, "EEEEE")}
              </span>
              <span className="text-sm font-semibold tabular-nums">{formatISO(d, "d")}</span>
              <span
                aria-hidden
                className={cn(
                  "h-1 w-1 rounded-full",
                  !mark && "opacity-0",
                  mark === "absence" ? "bg-warning" : isToday ? "bg-[var(--on-accent)]" : "bg-accent"
                )}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
