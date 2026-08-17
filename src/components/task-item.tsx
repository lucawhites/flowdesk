"use client";

import { useTransition } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Copy, Loader2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteTask, duplicateTaskToNextPeriod, toggleTaskStatus } from "@/app/(app)/tasks/actions";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TaskDialog } from "@/components/task-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, initials } from "@/lib/utils";
import { isDueToday, isOverdue } from "@/lib/task-helpers";
import type { TaskWithRelations, TeamMember } from "@/lib/types";

export function TaskItem({
  task,
  members,
  currentUserId,
  currentUserRole,
  showAssignee = false,
}: {
  task: TaskWithRelations;
  members: TeamMember[];
  currentUserId: string;
  currentUserRole: "ADMIN" | "MEMBER";
  showAssignee?: boolean;
}) {
  const [isToggling, startToggle] = useTransition();
  const [isMutating, startMutation] = useTransition();

  const done = task.status === "DONE";
  const overdue = isOverdue(task.dueDate, task.status);
  const dueToday = isDueToday(task.dueDate);
  const canManage = task.creatorId === currentUserId || currentUserRole === "ADMIN";

  return (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-primary/40",
        done && "opacity-60"
      )}
    >
      <div className="pt-0.5">
        {isToggling ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : (
          <Checkbox
            checked={done}
            onCheckedChange={(checked) => {
              startToggle(async () => {
                await toggleTaskStatus(task.id, checked === true);
              });
            }}
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-medium text-foreground", done && "line-through")}>{task.title}</p>
        {task.description && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{task.description}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {task.dueDate && (
            <Badge variant={overdue ? "danger" : dueToday ? "warning" : "neutral"}>
              {format(new Date(task.dueDate), "d MMM", { locale: it })}
            </Badge>
          )}
          {showAssignee && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-2 py-0.5 text-xs text-muted-foreground">
              <Avatar className="h-4 w-4">
                <AvatarFallback className="text-[9px]">{initials(task.assignee.name)}</AvatarFallback>
              </Avatar>
              {task.assignee.name}
            </span>
          )}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger className="rounded-lg p-1.5 text-muted-foreground opacity-0 outline-none transition-opacity hover:bg-surface-muted hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100 cursor-pointer">
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canManage && (
            <TaskDialog
              members={members}
              currentUserId={currentUserId}
              task={task}
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Pencil className="h-4 w-4" /> Modifica
                </DropdownMenuItem>
              }
            />
          )}
          <DropdownMenuItem
            disabled={isMutating}
            onSelect={() => {
              startMutation(async () => {
                await duplicateTaskToNextPeriod(task.id);
                toast.success("Task duplicata sul prossimo periodo");
              });
            }}
          >
            <Copy className="h-4 w-4" /> Duplica sul prossimo periodo
          </DropdownMenuItem>
          {canManage && (
            <DropdownMenuItem
              disabled={isMutating}
              className="text-danger data-[highlighted]:bg-danger-soft"
              onSelect={() => {
                startMutation(async () => {
                  await deleteTask(task.id);
                  toast.success("Task eliminata");
                });
              }}
            >
              <Trash2 className="h-4 w-4" /> Elimina
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
