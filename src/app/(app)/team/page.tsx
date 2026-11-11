import { requireSessionUser } from "@/lib/dal";
import { getTeamWork } from "@/lib/queries";
import { startOfWeekISO } from "@/lib/dates";
import { dailiesForToday, isObjectiveLate } from "@/lib/daily-helpers";
import { TeamView } from "./team-view";

// Versione essenziale: la pagina KPI completa è la tappa 2 dell'evoluzione.
export default async function TeamPage() {
  const user = await requireSessionUser();
  const { today, members, projects, objectives, dailies } = await getTeamWork(user.teamId);
  const weekStart = startOfWeekISO(today);

  const todayDailies = dailiesForToday(dailies, today);
  const doneThisWeek = dailies.filter((d) => d.completedOn !== null && d.completedOn >= weekStart);

  const memberStats = members.map((m) => {
    const mineToday = todayDailies.filter((d) => d.assignee.id === m.id);
    return {
      ...m,
      todayTotal: mineToday.length,
      todayDone: mineToday.filter((d) => d.completedOn !== null).length,
      weekDone: doneThisWeek.filter((d) => d.assignee.id === m.id).length,
      openObjectives: objectives.filter((o) => o.assignee.id === m.id && o.progress < 100).length,
    };
  });

  const totals = {
    doneToday: todayDailies.filter((d) => d.completedOn !== null).length,
    todayTotal: todayDailies.length,
    doneThisWeek: doneThisWeek.length,
    late:
      objectives.filter((o) => isObjectiveLate(o, today)).length +
      todayDailies.filter((d) => d.date < today && d.completedOn === null).length,
  };

  return (
    <TeamView
      teamName={user.teamName}
      currentUserId={user.id}
      totals={totals}
      memberStats={memberStats}
      projects={projects.map((p) => ({ id: p.id, name: p.name, progress: p.progress, objectives: p.objectives.length }))}
    />
  );
}
