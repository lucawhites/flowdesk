import { addDaysISO, formatISO, startOfWeekISO } from "@/lib/dates";
import type { CalendarEventItem } from "@/lib/types";

/** Eventi che cadono in un giorno, in ordine: prima quelli di tutto il giorno, poi per orario. */
export function eventsOnDay(events: CalendarEventItem[], iso: string) {
  return events
    .filter((e) => e.startDate <= iso && iso <= e.endDate)
    .sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? "") || a.title.localeCompare(b.title));
}

/** "14:00–15:00", "dalle 14:00" oppure null se vale tutto il giorno. */
export function eventTimeLabel(event: Pick<CalendarEventItem, "startTime" | "endTime">) {
  if (!event.startTime) return null;
  return event.endTime ? `${event.startTime}–${event.endTime}` : `dalle ${event.startTime}`;
}

/** "dal 16 al 20 nov" per gli eventi di più giorni, altrimenti null. */
export function eventRangeLabel(event: Pick<CalendarEventItem, "startDate" | "endDate">) {
  if (event.startDate === event.endDate) return null;
  const sameMonth = event.startDate.slice(0, 7) === event.endDate.slice(0, 7);
  return `dal ${formatISO(event.startDate, sameMonth ? "d" : "d MMM")} al ${formatISO(event.endDate, "d MMM")}`;
}

/** Riga breve per i riepiloghi: "14:00–15:00 · Appuntamento · Luca". */
export function eventSummary(event: CalendarEventItem) {
  const firstName = event.person?.name.split(" ")[0];
  return [eventTimeLabel(event), event.title, firstName].filter(Boolean).join(" · ");
}

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

export function isMonth(value: string | undefined): value is string {
  return !!value && MONTH.test(value);
}

/** Sposta un mese "YYYY-MM" avanti o indietro. */
export function shiftMonth(month: string, delta: number) {
  const [year, m] = month.split("-").map(Number);
  const index = year * 12 + (m - 1) + delta;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`;
}

/** Primo e ultimo giorno del mese, più le settimane intere (lun-dom) che lo contengono. */
export function monthGrid(month: string) {
  const first = `${month}-01`;
  const last = addDaysISO(`${shiftMonth(month, 1)}-01`, -1);
  const start = startOfWeekISO(first);
  const end = addDaysISO(startOfWeekISO(last), 6);
  const days: string[] = [];
  for (let day = start; day <= end; day = addDaysISO(day, 1)) days.push(day);
  return { first, last, start, end, days };
}
