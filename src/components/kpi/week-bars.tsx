import { formatISO } from "@/lib/dates";
import { cn } from "@/lib/utils";

/** Daily completate negli ultimi 7 giorni: una serie, barre sottili, etichetta solo su oggi.
 *  Oggi è la barra piena e sfumata; i giorni passati sono più tenui. Le barre crescono all'apertura. */
export function WeekBars({ days, today }: { days: { day: string; done: number }[]; today: string }) {
  const max = Math.max(1, ...days.map((d) => d.done));

  return (
    <figure>
      <div className="flex h-44 items-end gap-2" aria-hidden>
        {days.map(({ day, done }, i) => {
          const isToday = day === today;
          return (
            <div key={day} className="group relative flex h-full flex-1 flex-col items-center justify-end">
              {/* Tooltip al passaggio del mouse / tocco */}
              <span className="pointer-events-none absolute -top-1 z-10 -translate-y-full whitespace-nowrap glass rounded-md border border-border px-2 py-1 text-[0.6875rem] text-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                {formatISO(day, "EEE d MMM")}: {done} daily
              </span>
              {isToday && <span className="mb-1 text-xs font-semibold text-foreground">{done}</span>}
              <div
                className={cn(
                  "chart-bar w-full max-w-9 rounded-t-[6px] rounded-b-[2px]",
                  isToday ? "bg-linear-to-t from-chart-1 to-accent-light" : "bg-chart-1-soft"
                )}
                style={{
                  height: done > 0 ? `${Math.max(4, (done / max) * 100)}%` : "2px",
                  animationDelay: `${i * 50}ms`,
                }}
              />
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
