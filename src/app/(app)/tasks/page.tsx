import { requireSessionUser } from "@/lib/dal";
import { getTeamWork } from "@/lib/queries";
import { TasksView, type TasksTab } from "./tasks-view";

const TABS: TasksTab[] = ["daily", "obiettivi", "progetti"];

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ vista?: string }> }) {
  const user = await requireSessionUser();
  const [{ vista }, work] = await Promise.all([searchParams, getTeamWork(user.teamId)]);
  const initialTab = TABS.includes(vista as TasksTab) ? (vista as TasksTab) : "daily";

  return (
    <TasksView
      {...work}
      initialTab={initialTab}
      currentUserId={user.id}
      currentUserRole={user.role}
    />
  );
}
