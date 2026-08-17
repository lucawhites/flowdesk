import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/dal";
import { sortTasks } from "@/lib/task-helpers";
import { TeamView } from "./team-view";

export default async function TeamPage() {
  const user = await requireSessionUser();

  const [tasks, members] = await Promise.all([
    prisma.task.findMany({
      where: { teamId: user.teamId },
      include: { assignee: { select: { id: true, name: true } } },
    }),
    prisma.user.findMany({
      where: { teamId: user.teamId },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const sortedTasks = sortTasks(tasks);

  const memberStats = members.map((member) => {
    const memberTasks = tasks.filter((t) => t.assigneeId === member.id);
    const done = memberTasks.filter((t) => t.status === "DONE").length;
    return {
      ...member,
      total: memberTasks.length,
      done,
      pending: memberTasks.length - done,
    };
  });

  const totals = {
    total: tasks.length,
    done: tasks.filter((t) => t.status === "DONE").length,
    pending: tasks.filter((t) => t.status === "TODO").length,
    overdue: tasks.filter((t) => t.status === "TODO" && t.dueDate && new Date(t.dueDate) < new Date(new Date().toDateString())).length,
  };

  return (
    <TeamView
      tasks={sortedTasks}
      members={members}
      memberStats={memberStats}
      totals={totals}
      currentUserId={user.id}
      currentUserRole={user.role}
      teamName={user.teamName}
    />
  );
}
