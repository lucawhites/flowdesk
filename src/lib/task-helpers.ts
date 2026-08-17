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

export const PRIORITY_LABELS: Record<"LOW" | "MEDIUM" | "HIGH", string> = {
  LOW: "Bassa",
  MEDIUM: "Media",
  HIGH: "Alta",
};

export const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Bassa" },
  { value: "MEDIUM", label: "Media" },
  { value: "HIGH", label: "Alta" },
] as const;

export const PRIORITY_BADGE_VARIANT: Record<"LOW" | "MEDIUM" | "HIGH", "neutral" | "warning" | "danger"> = {
  LOW: "neutral",
  MEDIUM: "warning",
  HIGH: "danger",
};

const PRIORITY_WEIGHT: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

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

export function sortTasks<
  T extends { status: string; priority: string; dueDate: Date | null; completedAt: Date | null; createdAt: Date },
>(tasks: T[]): T[] {
  return [...tasks].sort((a, b) => {
    if (a.status !== b.status) return a.status === "DONE" ? 1 : -1;
    if (a.status === "DONE") {
      return (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0);
    }
    const aPriority = PRIORITY_WEIGHT[a.priority] ?? 1;
    const bPriority = PRIORITY_WEIGHT[b.priority] ?? 1;
    if (aPriority !== bPriority) return aPriority - bPriority;
    const aTime = a.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const bTime = b.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
    if (aTime !== bTime) return aTime - bTime;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });
}
