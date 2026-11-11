import { format } from "date-fns";
import { it } from "date-fns/locale";

// Il team lavora in Italia ma il server (Vercel) gira in UTC: il "giorno"
// si calcola sempre sul fuso Europe/Rome e si passa al client come "YYYY-MM-DD".
const TIME_ZONE = "Europe/Rome";
const isoFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Giorno (YYYY-MM-DD) in cui cade un istante, sul fuso italiano. */
export function romeISO(instant: Date) {
  return isoFormatter.format(instant);
}

export function todayISO() {
  return romeISO(new Date());
}

/** Le colonne @db.Date tornano come mezzanotte UTC: basta leggere la parte data. */
export function dateColumnToISO(date: Date) {
  return date.toISOString().slice(0, 10);
}

/** Da "YYYY-MM-DD" al valore da salvare in una colonna @db.Date. */
export function isoToDateColumn(iso: string) {
  return new Date(`${iso}T00:00:00.000Z`);
}

export function addDaysISO(iso: string, days: number) {
  const date = isoToDateColumn(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return dateColumnToISO(date);
}

/** Lunedì della settimana che contiene il giorno indicato. */
export function startOfWeekISO(iso: string) {
  const weekday = isoToDateColumn(iso).getUTCDay(); // 0 = domenica
  return addDaysISO(iso, weekday === 0 ? -6 : 1 - weekday);
}

export function formatISO(iso: string, pattern = "d MMM") {
  // Mezzogiorno UTC: lo stesso giorno in qualunque fuso del browser.
  return format(new Date(`${iso}T12:00:00.000Z`), pattern, { locale: it });
}

export function relativeDayLabel(iso: string, today: string) {
  if (iso === today) return "Oggi";
  if (iso === addDaysISO(today, 1)) return "Domani";
  if (iso === addDaysISO(today, -1)) return "Ieri";
  return formatISO(iso, "EEEE d MMMM");
}

/** Etichetta di sezione: "Domani · giovedì 12 novembre" oppure solo il giorno. */
export function dayHeading(iso: string, today: string) {
  const full = formatISO(iso, "EEEE d MMMM");
  if (iso === today) return `Oggi · ${full}`;
  if (iso === addDaysISO(today, 1)) return `Domani · ${full}`;
  return full.charAt(0).toUpperCase() + full.slice(1);
}

/** I prossimi giorni lavorativi (lun-ven) dopo quello indicato. */
export function nextWorkingDays(from: string, count: number) {
  const days: string[] = [];
  let day = from;
  while (days.length < count) {
    day = addDaysISO(day, 1);
    const weekday = isoToDateColumn(day).getUTCDay();
    if (weekday !== 0 && weekday !== 6) days.push(day);
  }
  return days;
}
