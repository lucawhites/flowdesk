"use client";

import { useState } from "react";
import { ChartNoAxesColumn, Grip } from "lucide-react";
import { WeekBars } from "@/components/kpi/week-bars";
import { LensSegmented } from "@/components/ui/lens-segmented";
import { formatISO } from "@/lib/dates";
import { cn } from "@/lib/utils";

type Mode = "dots" | "bars";
type Day = { day: string; done: number };

/** Puntini per colonna oltre i quali un puntino vale più daily. */
const CAPACITY = 12;

/**
 * Daily completate negli ultimi 7 giorni, a puntini (predefinito) o a barre.
 * Si passa da una vista all'altra col selettore a lente; ogni vista entra con la sua animazione.
 */
export function WeekChart({ days, today, todayOpen }: { days: Day[]; today: string; todayOpen: number }) {
  const [mode, setMode] = useState<Mode>("bars");

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {mode === "dots" ? (
          <p className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-chart-1" /> Fatte
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full border-[1.5px] border-chart-1/50" /> Da fare oggi
            </span>
          </p>
        ) : (
          <span />
        )}
        <LensSegmented
          ariaLabel="Tipo di grafico"
          value={mode}
          onChange={setMode}
          options={[
            { value: "bars", label: "Barre", icon: <ChartNoAxesColumn className="h-3.5 w-3.5" /> },
            { value: "dots", label: "Puntini", icon: <Grip className="h-3.5 w-3.5" /> },
          ]}
        />
      </div>
      <div key={mode} className="chart-swap">
        {mode === "dots" ? (
          <WeekDots days={days} today={today} todayOpen={todayOpen} />
        ) : (
          <WeekBars days={days} today={today} />
        )}
      </div>
    </div>
  );
}

/**
 * Ogni daily fatta è un puntino che si impila; oggi ha in più i puntini vuoti delle daily ancora
 * da fare e la linea tratteggiata con l'etichetta "Oggi". I puntini entrano uno dopo l'altro.
 */
function WeekDots({ days, today, todayOpen }: { days: Day[]; today: string; todayOpen: number }) {
  // La scala la fanno solo le daily fatte; quelle da fare oggi riempiono al massimo lo spazio rimasto.
  const unit = Math.ceil(Math.max(1, ...days.map((d) => d.done)) / CAPACITY);
  const dots = (n: number) => (n > 0 ? Math.max(1, Math.round(n / unit)) : 0);

  return (
    <figure>
      <div className="flex h-44 items-end gap-2" aria-hidden>
        {days.map(({ day, done }, col) => {
          const isToday = day === today;
          const full = dots(done);
          const ghost = isToday ? Math.min(dots(todayOpen), CAPACITY - full) : 0;
          return (
            <div key={day} className="group relative flex h-full min-w-0 flex-1 flex-col items-center justify-end">
              <span className="pointer-events-none absolute -top-1 z-10 -translate-y-full whitespace-nowrap glass rounded-md border border-border px-2 py-1 text-[0.6875rem] text-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                <span className="capitalize">{formatISO(day, "EEE d MMM")}</span>: {done} fatte{isToday && todayOpen > 0 ? `, ${todayOpen} da fare` : ""}
              </span>
              {isToday && (
                <>
                  <span className="num absolute right-0 top-0 z-[1] whitespace-nowrap rounded-full bg-foreground px-1.5 py-0.5 text-[0.6875rem] font-semibold text-background">
                    Oggi · {done}
                  </span>
                  <span className="absolute bottom-0 top-6 left-1/2 border-l border-dashed border-foreground/35" />
                </>
              )}
              <div className="relative flex flex-col-reverse items-center gap-[3px]">
                {Array.from({ length: full + ghost }, (_, row) => (
                  <span
                    key={row}
                    className={cn(
                      "dot-pop h-2 w-2 rounded-full",
                      row >= full
                        ? "border-[1.5px] border-chart-1/50 bg-surface"
                        : isToday
                          ? "bg-chart-1"
                          : "bg-chart-1/55"
                    )}
                    style={{ animationDelay: `${col * 60 + row * 28}ms` }}
                  />
                ))}
                {full + ghost === 0 && <span className="h-2 w-2 rounded-full bg-border" />}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2 border-t border-border pt-2" aria-hidden>
        {days.map(({ day }) => (
          <span
            key={day}
            className={cn(
              "flex-1 text-center text-[0.6875rem] capitalize",
              day === today ? "font-semibold text-foreground" : "text-muted-foreground"
            )}
          >
            {day === today ? "Oggi" : formatISO(day, "EEE")}
          </span>
        ))}
      </div>
      {unit > 1 && <figcaption className="num mt-2 text-[0.6875rem] text-muted-foreground">1 puntino = {unit} daily</figcaption>}
      <table className="sr-only">
        <caption>Daily completate negli ultimi 7 giorni</caption>
        <tbody>
          {days.map(({ day, done }) => (
            <tr key={day}>
              <th scope="row">{formatISO(day, "EEEE d MMMM")}</th>
              <td>{done}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
