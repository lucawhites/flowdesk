"use client";

import { useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteProject } from "@/app/(app)/work-actions";
import { ItemMenu } from "@/components/item-menu";
import { ObjectiveDialog } from "@/components/objective-dialog";
import { ProjectDialog } from "@/components/project-dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { isObjectiveLate } from "@/lib/daily-helpers";
import { cn } from "@/lib/utils";
import type { ProjectItem, Role, TeamMember } from "@/lib/types";

export function ProjectCard({
  project,
  projects,
  members,
  currentUserId,
  currentUserRole,
  today,
  onShowObjectives,
}: {
  project: ProjectItem;
  projects: { id: string; name: string }[];
  members: TeamMember[];
  currentUserId: string;
  currentUserRole: Role;
  today: string;
  onShowObjectives: () => void;
}) {
  const [, startTransition] = useTransition();
  const lateCount = project.objectives.filter((o) => isObjectiveLate(o, today)).length;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-foreground">{project.name}</p>
          {project.description && <p className="mt-0.5 text-xs text-muted-foreground">{project.description}</p>}
        </div>
        {currentUserRole === "ADMIN" && (
          <ItemMenu>
            <ProjectDialog
              project={project}
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Pencil className="h-4 w-4" /> Modifica
                </DropdownMenuItem>
              }
            />
            <DropdownMenuItem
              className="text-danger data-[highlighted]:bg-danger-soft"
              onSelect={() => {
                const message =
                  project.objectives.length > 0
                    ? `Eliminare "${project.name}" e i suoi ${project.objectives.length} obiettivi? Le daily collegate restano, come daily libere.`
                    : `Eliminare il progetto "${project.name}"?`;
                if (!window.confirm(message)) return;
                startTransition(async () => {
                  await deleteProject(project.id);
                  toast.success("Progetto eliminato");
                });
              }}
            >
              <Trash2 className="h-4 w-4" /> Elimina
            </DropdownMenuItem>
          </ItemMenu>
        )}
      </div>

      <div>
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className="text-xs text-muted-foreground">
            {project.objectives.length === 0
              ? "Nessun obiettivo"
              : `${project.objectives.length} obiettiv${project.objectives.length === 1 ? "o" : "i"}${
                  lateCount > 0 ? ` · ${lateCount} in ritardo` : ""
                }`}
          </span>
          <span className="text-xl font-semibold text-foreground">
            {project.progress === null ? "—" : `${project.progress}%`}
          </span>
        </div>
        <Progress value={project.progress ?? 0} />
      </div>

      {project.objectives.length > 0 && (
        <ul className="flex flex-col gap-2.5">
          {project.objectives.map((o) => (
            <li key={o.id} className="flex items-center gap-3">
              <span className="min-w-0 flex-1 truncate text-xs text-foreground">{o.title}</span>
              <Progress
                value={o.progress}
                className="h-1.5 w-20 shrink-0"
                indicatorClassName={cn(isObjectiveLate(o, today) && "bg-danger")}
              />
              <span className="w-9 shrink-0 text-right text-xs text-muted-foreground">{o.progress}%</span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        <ObjectiveDialog
          members={members}
          projects={projects}
          currentUserId={currentUserId}
          defaultProjectId={project.id}
          trigger={
            <Button size="sm" variant="outline">
              <Plus className="h-3.5 w-3.5" /> Obiettivo
            </Button>
          }
        />
        {project.objectives.length > 0 && (
          <Button size="sm" variant="ghost" onClick={onShowObjectives}>
            Vedi obiettivi
          </Button>
        )}
      </div>
    </div>
  );
}
