import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/dal";
import { sortTasks } from "@/lib/task-helpers";
import { DashboardView } from "./dashboard-view";

export default async function DashboardPage() {
  const user = await requireSessionUser();

  const [tasks, members] = await Promise.all([
    prisma.task.findMany({
      where: { teamId: user.teamId, assigneeId: user.id },
      include: { assignee: { select: { id: true, name: true } } },
    }),
    prisma.user.findMany({
      where: { teamId: user.teamId },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const byPeriod = {
    DAILY: sortTasks(tasks.filter((t) => t.period === "DAILY")),
    WEEKLY: sortTasks(tasks.filter((t) => t.period === "WEEKLY")),
    MONTHLY: sortTasks(tasks.filter((t) => t.period === "MONTHLY")),
  };

  return (
    <DashboardView
      tasksByPeriod={byPeriod}
      members={members}
      currentUserId={user.id}
      currentUserRole={user.role}
      userName={user.name ?? ""}
    />
  );
}
