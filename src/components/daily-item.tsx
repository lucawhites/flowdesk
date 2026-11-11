"use client";

import { useOptimistic, useTransition } from "react";
import { Pencil, Target, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { deleteDaily, toggleDaily } from "@/app/(app)/work-actions";
import { DailyDialog } from "@/components/daily-dialog";
import { ItemMenu } from "@/components/item-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { formatISO } from "@/lib/dates";
import { isCarriedOver } from "@/lib/daily-helpers";
import { cn, initials } from "@/lib/utils";
import type { DailyItem, ObjectiveOption, Role, TeamMember } from "@/lib/types";

export function DailyRow({
  daily,
  members,
  objectives,
  currentUserId,
  currentUserRole,
  today,
  showAssignee = false,
  showDate = false,
}: {
  daily: DailyItem;
  members: TeamMember[];
  objectives: ObjectiveOption[];
  currentUserId: string;
  currentUserRole: Role;
  today: string;
  showAssignee?: boolean;
  showDate?: boolean;
}) {
  const [, startTransition] = useTransition();
  const [done, setOptimisticDone] = useOptimistic(daily.completedOn !== null);
  const carried = isCarriedOver(daily, today);
  const canManage =
    currentUserRole === "ADMIN" || daily.creatorId === currentUserId || daily.assignee.id === currentUserId;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border border-border bg-surface p-3.5 transition-colors hover:border-primary/40",
        done && "opacity-60"
      )}
    >
      <div className="pt-0.5">
        <Checkbox
          checked={done}
          aria-label={done ? "Segna come da fare" : "Segna come fatta"}
          onCheckedChange={(checked) => {
            startTransition(async () => {
              setOptimisticDone(checked === true);
              await toggleDaily(daily.id, checked === true);
            });
          }}
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-medium text-foreground", done && "line-through")}>{daily.title}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {daily.objective && (
            <Badge variant="primary" className="max-w-full">
              <Target className="h-3 w-3 shrink-0" />
              <span className="truncate">
                {daily.objective.projectName} · {daily.objective.title}
              </span>
            </Badge>
          )}
          {carried && !done && (
            <Badge variant="warning">
              <Undo2 className="h-3 w-3" />
              Riportata dal {formatISO(daily.date)}
            </Badge>
          )}
          {showDate && !carried && <Badge>{formatISO(daily.date, "EEE d MMM")}</Badge>}
          {showAssignee && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-2 py-0.5 text-xs text-muted-foreground">
              <Avatar className="h-4 w-4">
                <AvatarFallback className="text-[9px]">{initials(daily.assignee.name)}</AvatarFallback>
              </Avatar>
              {daily.assignee.name}
            </span>
          )}
        </div>
      </div>

      {canManage && (
        <ItemMenu>
          <DailyDialog
            members={members}
            objectives={objectives}
            currentUserId={currentUserId}
            today={today}
            daily={daily}
            trigger={
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Pencil className="h-4 w-4" /> Modifica
              </DropdownMenuItem>
            }
          />
          <DropdownMenuItem
            className="text-danger data-[highlighted]:bg-danger-soft"
            onSelect={() => {
              startTransition(async () => {
                await deleteDaily(daily.id);
                toast.success("Daily eliminata");
              });
            }}
          >
            <Trash2 className="h-4 w-4" /> Elimina
          </DropdownMenuItem>
        </ItemMenu>
      )}
    </div>
  );
}
