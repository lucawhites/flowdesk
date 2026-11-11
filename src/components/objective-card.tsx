"use client";

import { useTransition } from "react";
import { CalendarDays, Check, ChevronDown, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteObjective } from "@/app/(app)/tasks/actions";
import { DailyDialog } from "@/components/daily-dialog";
import { ItemMenu } from "@/components/item-menu";
import { ObjectiveDialog } from "@/components/objective-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { formatISO } from "@/lib/dates";
import { isObjectiveLate } from "@/lib/daily-helpers";
import { cn, initials } from "@/lib/utils";
import type { ObjectiveItem, ObjectiveOption, Role, TeamMember } from "@/lib/types";

export function ObjectiveCard({
  objective,
  members,
  projects,
  objectiveOptions,
  currentUserId,
  currentUserRole,
  today,
}: {
  objective: ObjectiveItem;
  members: TeamMember[];
  projects: { id: string; name: string }[];
  objectiveOptions: ObjectiveOption[];
  currentUserId: string;
  currentUserRole: Role;
  today: string;
}) {
  const [, startTransition] = useTransition();
  const late = isObjectiveLate(objective, today);
  const complete = objective.dailyTotal > 0 && objective.progress === 100;
  const canManage =
    currentUserRole === "ADMIN" || objective.creatorId === currentUserId || objective.assignee.id === currentUserId;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{objective.title}</p>
          {objective.description && (
            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{objective.description}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-2 py-0.5 text-xs text-muted-foreground">
              <Avatar className="h-4 w-4">
                <AvatarFallback className="text-[9px]">{initials(objective.assignee.name)}</AvatarFallback>
              </Avatar>
              {objective.assignee.name}
            </span>
            {objective.dueDate && (
              <Badge variant={late ? "danger" : "neutral"}>
                <CalendarDays className="h-3 w-3" />
                {late ? "Scaduto il " : "Entro il "}
                {formatISO(objective.dueDate)}
              </Badge>
            )}
            {complete && (
              <Badge variant="success">
                <Check className="h-3 w-3" /> Raggiunto
              </Badge>
            )}
          </div>
        </div>

        {canManage && (
          <ItemMenu>
            <ObjectiveDialog
              members={members}
              projects={projects}
              currentUserId={currentUserId}
              objective={objective}
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Pencil className="h-4 w-4" /> Modifica
                </DropdownMenuItem>
              }
            />
            <DropdownMenuItem
              className="text-danger data-[highlighted]:bg-danger-soft"
              onSelect={() => {
                if (!window.confirm(`Eliminare l'obiettivo "${objective.title}"? Le daily collegate restano, come daily libere.`)) return;
                startTransition(async () => {
                  await deleteObjective(objective.id);
                  toast.success("Obiettivo eliminato");
                });
              }}
            >
              <Trash2 className="h-4 w-4" /> Elimina
            </DropdownMenuItem>
          </ItemMenu>
        )}
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {objective.dailyTotal === 0
              ? "Nessuna daily collegata"
              : `${objective.dailyDone} di ${objective.dailyTotal} daily completate`}
          </span>
          <span className="font-semibold text-foreground">{objective.progress}%</span>
        </div>
        <Progress
          value={objective.progress}
          indicatorClassName={cn(complete && "bg-success", late && "bg-danger")}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        {objective.dailies.length > 0 ? (
          <details className="group min-w-0 flex-1">
            <summary className="flex cursor-pointer list-none items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
              <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
              Vedi le daily
            </summary>
            <ul className="mt-2 flex flex-col gap-1.5">
              {objective.dailies.map((d) => (
                <li key={d.id} className="flex items-center gap-2 text-xs">
                  <span
                    className={cn(
                      "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border",
                      d.done ? "border-success bg-success text-white" : "border-border"
                    )}
                  >
                    {d.done && <Check className="h-2.5 w-2.5" />}
                  </span>
                  <span className={cn("min-w-0 flex-1 truncate", d.done ? "text-muted-foreground line-through" : "text-foreground")}>
                    {d.title}
                  </span>
                  <span className="shrink-0 text-muted-foreground">
                    {d.assigneeName.split(" ")[0]} · {formatISO(d.date)}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        ) : (
          <span />
        )}
        <DailyDialog
          members={members}
          objectives={objectiveOptions}
          currentUserId={currentUserId}
          today={today}
          defaultObjectiveId={objective.id}
          trigger={
            <Button size="sm" variant="outline" className="self-start">
              <Plus className="h-3.5 w-3.5" /> Daily
            </Button>
          }
        />
      </div>
    </div>
  );
}
