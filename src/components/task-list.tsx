import { ClipboardList } from "lucide-react";
import { TaskItem } from "@/components/task-item";
import type { TaskWithRelations, TeamMember } from "@/lib/types";

export function TaskList({
  tasks,
  members,
  currentUserId,
  currentUserRole,
  showAssignee = false,
  emptyMessage = "Nessuna task qui. Goditi la calma. ☕️",
}: {
  tasks: TaskWithRelations[];
  members: TeamMember[];
  currentUserId: string;
  currentUserRole: "ADMIN" | "MEMBER";
  showAssignee?: boolean;
  emptyMessage?: string;
}) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-14 text-center">
        <ClipboardList className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          members={members}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          showAssignee={showAssignee}
        />
      ))}
    </div>
  );
}
