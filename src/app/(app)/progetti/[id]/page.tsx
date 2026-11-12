import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Plus, Target } from "lucide-react";
import { requireSessionUser } from "@/lib/dal";
import { getTeamWork } from "@/lib/queries";
import { isObjectiveLate } from "@/lib/daily-helpers";
import { EmptyState } from "@/components/empty-state";
import { ObjectiveDialog } from "@/components/objective-dialog";
import { ObjectiveGrid } from "@/components/objective-grid";
import { ProjectDialog } from "@/components/project-dialog";
import { ProjectAgentNotes } from "@/components/project-agent-notes";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireSessionUser();
  const { today, members, projects, objectives } = await getTeamWork(user.teamId);
  const project = projects.find((p) => p.id === id);
  if (!project) notFound();

  const projectOptions = projects.map((p) => ({ id: p.id, name: p.name }));
  const objectiveOptions = objectives
    .filter((o) => !o.reached)
    .map((o) => ({ id: o.id, title: o.title, projectName: o.project.name }));
  // Note per l'agente: si leggono a parte e solo per l'amministratore, così non arrivano al resto del team.
  const agentNotes =
    user.role === "ADMIN"
      ? ((await prisma.project.findFirst({ where: { id, teamId: user.teamId }, select: { agentNotes: true } }))?.agentNotes ?? "")
      : null;
  const total = project.objectives.length;
  const reached = project.objectives.filter((o) => o.reached).length;
  const late = project.objectives.filter((o) => isObjectiveLate(o, today)).length;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <Link href="/progetti" className="flex items-center gap-1 self-start text-xs font-medium text-accent hover:underline">
        <ArrowLeft className="h-3.5 w-3.5" /> Progetti
      </Link>

      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{project.name}</h1>
            {project.description && (
              <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{project.description}</p>
            )}
          </div>
          {user.role === "ADMIN" && (
            <ProjectDialog
              project={project}
              trigger={
                <Button size="sm" variant="outline" className="shrink-0">
                  <Pencil className="h-3.5 w-3.5" /> Modifica
                </Button>
              }
            />
          )}
        </div>

        <div>
          <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              {total === 0
                ? "Nessun obiettivo"
                : `${total} obiettiv${total === 1 ? "o" : "i"} · ${reached} raggiunt${reached === 1 ? "o" : "i"}${
                    late > 0 ? ` · ${late} in ritardo` : ""
                  }`}
            </span>
            <span className="text-2xl font-semibold text-foreground">
              {project.progress === null ? "—" : `${project.progress}%`}
            </span>
          </div>
          <Progress value={project.progress ?? 0} />
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Obiettivi</h2>
          <ObjectiveDialog
            members={members}
            projects={projectOptions}
            currentUserId={user.id}
            defaultProjectId={project.id}
            trigger={
              <Button size="sm">
                <Plus className="h-4 w-4" /> Nuovo obiettivo
              </Button>
            }
          />
        </div>
        {total === 0 ? (
          <EmptyState icon={Target} message="Questo progetto non ha ancora obiettivi." />
        ) : (
          <ObjectiveGrid
            objectives={project.objectives}
            members={members}
            projects={projectOptions}
            objectiveOptions={objectiveOptions}
            currentUserId={user.id}
            currentUserRole={user.role}
            today={today}
          />
        )}
      </section>

      {agentNotes !== null && <ProjectAgentNotes projectId={project.id} initial={agentNotes} />}
    </div>
  );
}
