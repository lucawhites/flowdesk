import type { DailyItem, ObjectiveItem } from "@/lib/types";

/**
 * Daily "di oggi" con carry-over: pianificate per oggi, più quelle dei giorni
 * passati non ancora completate (o completate proprio oggi, così non spariscono
 * appena spuntate).
 */
export function dailiesForToday(dailies: DailyItem[], today: string) {
  return dailies.filter(
    (d) => d.date === today || (d.date < today && (d.completedOn === null || d.completedOn === today))
  );
}

export function upcomingDailies(dailies: DailyItem[], today: string) {
  return dailies.filter((d) => d.date > today);
}

/** Una daily è "riportata" se era pianificata per un giorno passato. */
export function isCarriedOver(daily: DailyItem, today: string) {
  return daily.date < today;
}

export function sortDailies(dailies: DailyItem[]) {
  return [...dailies].sort((a, b) => {
    const aDone = a.completedOn !== null;
    const bDone = b.completedOn !== null;
    if (aDone !== bDone) return aDone ? 1 : -1;
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    return a.title.localeCompare(b.title, "it");
  });
}

export function isObjectiveLate(objective: ObjectiveItem, today: string) {
  return !!objective.dueDate && objective.dueDate < today && objective.progress < 100;
}
