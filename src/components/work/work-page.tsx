import { requireSessionUser } from "@/lib/dal";
import { getTeamWork } from "@/lib/queries";
import { TasksView, type Scope, type TasksTab } from "@/components/work/work-view";

/** Pagina server comune a Daily, Obiettivi e Progetti. */
export async function WorkPage({
  tab,
  projectFilter = null,
  scope = null,
  lateOnly = false,
  newDaily = null,
}: {
  tab: TasksTab;
  projectFilter?: string | null;
  /** Vista iniziale ("Mie" o "Tutto il team"), es. arrivando dalla Home. */
  scope?: Scope | null;
  lateOnly?: boolean;
  /** Apre subito "Nuova daily" (link dei Comandi rapidi). */
  newDaily?: { title: string } | null;
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
      initialNewDaily={newDaily}
      currentUserId={user.id}
      currentUserRole={user.role}
    />
  );
}
