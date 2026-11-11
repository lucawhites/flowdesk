import { requireSessionUser } from "@/lib/dal";
import { getTeamWork } from "@/lib/queries";
import { TasksView, type Scope, type TasksTab } from "@/components/work/work-view";

/** Pagina server comune a Daily, Obiettivi e Progetti. */
export async function WorkPage({
  tab,
  projectFilter = null,
  scope = null,
  lateOnly = false,
}: {
  tab: TasksTab;
  projectFilter?: string | null;
  /** Vista iniziale ("Mie" o "Tutto il team"), es. arrivando dalla Home. */
  scope?: Scope | null;
  lateOnly?: boolean;
}) {
  const user = await requireSessionUser();
  const work = await getTeamWork(user.teamId);
  const validFilter = projectFilter && work.projects.some((p) => p.id === projectFilter) ? projectFilter : null;

  return (
    <TasksView
      {...work}
      tab={tab}
      initialProjectFilter={validFilter}
      initialScope={scope}
      initialLateOnly={lateOnly}
      currentUserId={user.id}
      currentUserRole={user.role}
    />
  );
}
