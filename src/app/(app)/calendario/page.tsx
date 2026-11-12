import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { requireSessionUser } from "@/lib/dal";
import { getTeamMembers } from "@/lib/queries";
import { getTeamEvents } from "@/lib/calendar";
import {
  eventSummary,
  eventsOnDay,
  isMonth,
  monthGrid,
  shiftMonth,
} from "@/lib/calendar-helpers";
import {
  addDaysISO,
  dayHeading,
  formatISO,
  startOfWeekISO,
  todayISO,
} from "@/lib/dates";
import { EventDialog } from "@/components/calendar/event-dialog";
import { EventRow } from "@/components/calendar/event-row";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CalendarEventItem } from "@/lib/types";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
const MAX_CHIPS = 3;

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string; mese?: string; giorno?: string }>;
}) {
  const user = await requireSessionUser();
  const { vista, mese, giorno } = await searchParams;
  const today = todayISO();
  const currentMonth = today.slice(0, 7);
  const view = vista === "mese" ? "mese" : "settimana";

  // Settimana: da lunedì a domenica, attorno al giorno indicato (o a oggi).
  const anchor =
    giorno && ISO_DAY.test(giorno) && !Number.isNaN(Date.parse(giorno))
      ? giorno
      : today;
  const weekStart = startOfWeekISO(anchor);
  const weekEnd = addDaysISO(weekStart, 6);
  const weekDays = Array.from({ length: 7 }, (_, i) =>
    addDaysISO(weekStart, i),
  );
  const isCurrentWeek = weekStart === startOfWeekISO(today);

  const month = isMonth(mese) ? mese : currentMonth;
  const grid = monthGrid(month);

  const [members, events] = await Promise.all([
    getTeamMembers(user.teamId),
    view === "mese"
      ? getTeamEvents(user.teamId, grid.start, grid.end)
      : getTeamEvents(user.teamId, weekStart, weekEnd),
  ]);

  // Elenco del mese: nel mese in corso si parte da oggi; ogni evento compare una volta,
  // sotto il primo giorno in cui è visibile (le ferie non si ripetono per ogni giorno).
  const listStart = month === currentMonth ? today : grid.first;
  const groups = new Map<string, CalendarEventItem[]>();
  if (view === "mese") {
    for (const event of events) {
      if (event.endDate < listStart || event.startDate > grid.last) continue;
      const day = event.startDate < listStart ? listStart : event.startDate;
      groups.set(day, [...(groups.get(day) ?? []), event]);
    }
  }
  const listDays = [...groups.keys()].sort();

  const sameMonthWeek = weekStart.slice(0, 7) === weekEnd.slice(0, 7);
  const title =
    view === "mese"
      ? formatISO(grid.first, "MMMM yyyy")
      : `${formatISO(weekStart, sameMonthWeek ? "d" : "d MMM")} – ${formatISO(weekEnd, "d MMMM yyyy")}`;
  const atToday = view === "mese" ? month === currentMonth : isCurrentWeek;
  const prevHref =
    view === "mese"
      ? `/calendario?vista=mese&mese=${shiftMonth(month, -1)}`
      : `/calendario?giorno=${addDaysISO(weekStart, -7)}`;
  const nextHref =
    view === "mese"
      ? `/calendario?vista=mese&mese=${shiftMonth(month, 1)}`
      : `/calendario?giorno=${addDaysISO(weekStart, 7)}`;
  // Cambiando vista si resta sullo stesso periodo.
  const weekHref =
    month === currentMonth ? "/calendario" : `/calendario?giorno=${grid.first}`;
  const monthHref = `/calendario?vista=mese&mese=${(isCurrentWeek ? today : weekStart).slice(0, 7)}`;
  const defaultDate =
    view === "mese"
      ? month === currentMonth
        ? today
        : grid.first
      : isCurrentWeek
        ? today
        : weekStart;

  const navButton =
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-foreground outline-none transition-colors hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-ring";
  const dialogProps = { members, currentUserId: user.id };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Calendario
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Assenze, appuntamenti e tutto ciò che il team deve sapere. Le daily
            restano nella loro pagina.
          </p>
        </div>
        <div className="shrink-0">
          <EventDialog
            {...dialogProps}
            defaultDate={defaultDate}
            trigger={
              <Button>
                <Plus className="h-4 w-4" /> Nuovo evento
              </Button>
            }
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="inline-flex self-start rounded-xl bg-surface-muted p-1 text-xs font-medium">
          {(
            [
              ["settimana", "Settimana", weekHref],
              ["mese", "Mese", monthHref],
            ] as const
          ).map(([value, label, href]) => (
            <Link
              key={value}
              href={href}
              aria-current={view === value ? "page" : undefined}
              className={cn(
                "rounded-lg px-3 py-1.5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                view === value
                  ? "bg-surface text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </Link>
          ))}
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Link
            href={prevHref}
            aria-label={
              view === "mese" ? "Mese precedente" : "Settimana precedente"
            }
            className={navButton}
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <Link
            href={nextHref}
            aria-label={
              view === "mese" ? "Mese successivo" : "Settimana successiva"
            }
            className={navButton}
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
          <h2
            className={cn(
              "ml-1 min-w-0 text-base font-semibold text-foreground",
              view === "mese" && "capitalize",
            )}
          >
            {title}
          </h2>
          {!atToday && (
            <Link
              href={view === "mese" ? "/calendario?vista=mese" : "/calendario"}
              className="ml-auto shrink-0 text-xs font-medium text-accent hover:underline"
            >
              Torna a oggi
            </Link>
          )}
        </div>
      </div>

      {view === "settimana" ? (
        // Sette giorni: in colonna sul telefono, affiancati da tablet in su.
        <div className="flex flex-col divide-y divide-border md:grid md:grid-cols-7 md:gap-2 md:divide-y-0">
          {weekDays.map((day, index) => {
            const dayEvents = eventsOnDay(events, day);
            const isToday = day === today;
            return (
              <section
                key={day}
                className="flex min-w-0 flex-col gap-2 py-2.5 md:min-h-64 md:rounded-2xl md:bg-surface-muted/60 md:p-2"
              >
                <div className="flex items-center justify-between gap-1">
                  <h3
                    className={cn(
                      "text-sm font-semibold md:text-xs",
                      isToday ? "text-accent" : "text-muted-foreground",
                    )}
                  >
                    <span className="md:hidden">{dayHeading(day, today)}</span>
                    <span className="hidden md:inline">
                      {WEEKDAYS[index]} {formatISO(day, "d")}
                    </span>
                  </h3>
                  <EventDialog
                    {...dialogProps}
                    defaultDate={day}
                    trigger={
                      <button
                        type="button"
                        title="Aggiungi un evento in questo giorno"
                        aria-label={`Aggiungi un evento ${formatISO(day, "EEEE d MMMM")}`}
                        className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring md:h-6 md:w-6"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    }
                  />
                </div>
                {dayEvents.map((event) => (
                  <EventRow
                    key={event.id}
                    event={event}
                    {...dialogProps}
                    currentUserRole={user.role}
                    compact
                  />
                ))}
              </section>
            );
          })}
        </div>
      ) : (
        <>
          {/* Griglia del mese: solo da tablet in su, sul telefono basta l'elenco. */}
          <div className="hidden overflow-hidden rounded-2xl border border-border bg-surface shadow-sm md:block">
            <div className="grid grid-cols-7 border-b border-border bg-surface-muted">
              {WEEKDAYS.map((day) => (
                <p
                  key={day}
                  className="px-2 py-2 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground"
                >
                  {day}
                </p>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {grid.days.map((day, index) => {
                const inMonth = day.slice(0, 7) === month;
                const dayEvents = eventsOnDay(events, day);
                return (
                  <div
                    key={day}
                    className={cn(
                      "flex min-h-24 min-w-0 flex-col gap-1 border-border p-1.5",
                      index % 7 !== 6 && "border-r",
                      index < grid.days.length - 7 && "border-b",
                      !inMonth && "bg-surface-muted/50",
                    )}
                  >
                    <EventDialog
                      {...dialogProps}
                      defaultDate={day}
                      trigger={
                        <button
                          type="button"
                          title="Aggiungi un evento in questo giorno"
                          aria-label={`Aggiungi un evento ${formatISO(day, "EEEE d MMMM")}`}
                          className={cn(
                            "flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-xs font-medium outline-none transition-colors hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-ring",
                            day === today
                              ? "bg-accent text-white hover:bg-accent"
                              : inMonth
                                ? "text-foreground"
                                : "text-muted-foreground",
                          )}
                        >
                          {formatISO(day, "d")}
                        </button>
                      }
                    />
                    {dayEvents.slice(0, MAX_CHIPS).map((event) => (
                      <p
                        key={event.id}
                        title={eventSummary(event)}
                        className={cn(
                          "truncate rounded-md px-1.5 py-0.5 text-[0.6875rem] font-medium",
                          event.absence
                            ? "bg-warning-soft text-warning"
                            : "bg-accent-soft text-accent",
                        )}
                      >
                        {eventSummary(event)}
                      </p>
                    ))}
                    {dayEvents.length > MAX_CHIPS && (
                      <p className="px-1.5 text-[0.6875rem] text-muted-foreground">
                        +{dayEvents.length - MAX_CHIPS} altri
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {listDays.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              message={
                month === currentMonth
                  ? "Nessun evento in programma da oggi a fine mese."
                  : "Nessun evento in questo mese."
              }
            />
          ) : (
            listDays.map((day) => (
              <section key={day} className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  {dayHeading(day, today)}
                </h3>
                {groups.get(day)!.map((event) => (
                  <EventRow
                    key={event.id}
                    event={event}
                    {...dialogProps}
                    currentUserRole={user.role}
                  />
                ))}
              </section>
            ))
          )}
        </>
      )}
    </div>
  );
}
