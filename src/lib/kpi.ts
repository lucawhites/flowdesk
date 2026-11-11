import { addDaysISO, startOfWeekISO } from "@/lib/dates";
import { dailiesForToday, isObjectiveLate } from "@/lib/daily-helpers";
import type { DailyItem, ObjectiveItem, ProjectItem, TeamMember } from "@/lib/types";

const daysBetween = (from: string, to: string) =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);

const average = (values: number[]) =>
  values.length > 0 ? Math.round(values.reduce((s, v) => s + v, 0) / values.length) : null;

/** Tutti i KPI della pagina Team, calcolati dai dati già caricati da getTeamWork. */
export function computeKpis({
  today,
  members,
  projects,
  objectives,
  dailies,
}: {
  today: string;
  members: TeamMember[];
  projects: ProjectItem[];
  objectives: ObjectiveItem[];
  dailies: DailyItem[];
}) {
  const weekStart = startOfWeekISO(today);
  const todayDailies = dailiesForToday(dailies, today);
  const doneToday = todayDailies.filter((d) => d.completedOn === today).length;
  const doneThisWeek = dailies.filter((d) => d.completedOn !== null && d.completedOn >= weekStart);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const day = addDaysISO(today, i - 6);
    return { day, done: dailies.filter((d) => d.completedOn === day).length };
  });

  const openObjectives = objectives.filter((o) => !o.reached);
  const reachedObjectives = objectives.length - openObjectives.length;

  const lateObjectives = objectives
    .filter((o) => isObjectiveLate(o, today))
    .map((o) => ({ ...o, daysLate: daysBetween(o.dueDate!, today) }))
    .sort((a, b) => b.daysLate - a.daysLate);
  const lateDailies = dailies
    .filter((d) => d.completedOn === null && d.date < today)
    .map((d) => ({ ...d, daysLate: daysBetween(d.date, today) }))
    .sort((a, b) => b.daysLate - a.daysLate);

  const people = members.map((m) => {
    const mineToday = todayDailies.filter((d) => d.assignee.id === m.id);
    const mineObjectives = openObjectives.filter((o) => o.assignee.id === m.id);
    return {
      ...m,
      todayDone: mineToday.filter((d) => d.completedOn === today).length,
      todayTotal: mineToday.length,
      weekDone: doneThisWeek.filter((d) => d.assignee.id === m.id).length,
      openObjectives: mineObjectives.length,
      objectivesProgress: average(mineObjectives.map((o) => o.progress)),
      late:
        lateObjectives.filter((o) => o.assignee.id === m.id).length +
        lateDailies.filter((d) => d.assignee.id === m.id).length,
    };
  });

  const projectStats = projects.map((p) => ({
    id: p.id,
    name: p.name,
    progress: p.progress,
    objectives: p.objectives.length,
    reached: p.objectives.filter((o) => o.reached).length,
    late: p.objectives.filter((o) => isObjectiveLate(o, today)).length,
  }));

  return {
    today,
    doneToday,
    todayTotal: todayDailies.length,
    doneThisWeek: doneThisWeek.length,
    last7Days,
    openObjectives: openObjectives.length,
    reachedObjectives,
    openObjectivesProgress: average(openObjectives.map((o) => o.progress)),
    lateObjectives,
    lateDailies,
    people,
    projects: projectStats,
  };
}

export type Kpis = ReturnType<typeof computeKpis>;
