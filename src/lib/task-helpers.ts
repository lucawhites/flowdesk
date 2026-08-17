import { isPast, isToday, startOfDay } from "date-fns";

export const PERIOD_LABELS: Record<"DAILY" | "WEEKLY" | "MONTHLY", string> = {
  DAILY: "Giornaliera",
  WEEKLY: "Settimanale",
  MONTHLY: "Mensile",
};

export const PERIOD_TABS = [
  { value: "DAILY", label: "Giornaliere" },
  { value: "WEEKLY", label: "Settimanali" },
  { value: "MONTHLY", label: "Mensili" },
] as const;

export function isOverdue(dueDate: Date | null, status: string) {
  if (!dueDate || status === "DONE") return false;
  return isPast(dueDate) && !isToday(dueDate);
}

export function isDueToday(dueDate: Date | null) {
  if (!dueDate) return false;
  return isToday(dueDate);
}

export function startOfToday() {
  return startOfDay(new Date());
}

export function sortTasks<T extends { status: string; dueDate: Date | null; completedAt: Date | null; createdAt: Date }>(
  tasks: T[]
): T[] {
  return [...tasks].sort((a, b) => {
    if (a.status !== b.status) return a.status === "DONE" ? 1 : -1;
    if (a.status === "DONE") {
      return (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0);
    }
    const aTime = a.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const bTime = b.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
    if (aTime !== bTime) return aTime - bTime;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });
}
