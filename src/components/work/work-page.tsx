import { requireSessionUser } from "@/lib/dal";
import { getTeamWork } from "@/lib/queries";
import { TasksView, type TasksTab } from "@/components/work/work-view";

/** Pagina server comune a Daily, Obiettivi e Progetti. */
export async function WorkPage({ tab, projectFilter = null }: { tab: TasksTab; projectFilter?: string | null }) {
  const user = await requireSessionUser();
  const work = await getTeamWork(user.teamId);
  const validFilter = projectFilter && work.projects.some((p) => p.id === projectFilter) ? projectFilter : null;

  return (
    <TasksView
      {...work}
      tab={tab}
      initialProjectFilter={validFilter}
      currentUserId={user.id}
      currentUserRole={user.role}
    />
  );
}
