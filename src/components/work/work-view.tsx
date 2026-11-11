"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck2, FolderKanban, Plus, Target } from "lucide-react";
import { DailyDialog } from "@/components/daily-dialog";
import { DailyList } from "@/components/daily-list";
import { EmptyState } from "@/components/empty-state";
import { ObjectiveGrid } from "@/components/objective-grid";
import { ObjectiveDialog } from "@/components/objective-dialog";
import { ProjectCard } from "@/components/project-card";
import { ProjectDialog } from "@/components/project-dialog";
import { SortableList } from "@/components/sortable-list";
import { reorderItems } from "@/app/(app)/work-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { dayHeading, nextWorkingDays } from "@/lib/dates";
import { dailiesForToday, isObjectiveLate, upcomingDailies } from "@/lib/daily-helpers";
import { cn } from "@/lib/utils";
import type { DailyItem, ObjectiveItem, ObjectiveOption, ProjectItem, Role, TeamMember } from "@/lib/types";

export type TasksTab = "daily" | "obiettivi" | "progetti";

const HEADINGS: Record<TasksTab, { title: string; subtitle: string }> = {
  daily: { title: "Daily", subtitle: "Le microtask di oggi e dei prossimi giorni. Quelle non spuntate passano al giorno dopo." },
  obiettivi: { title: "Obiettivi", subtitle: "Ogni obiettivo avanza con le daily completate che gli sono collegate." },
  progetti: { title: "Progetti", subtitle: "Le aree di lavoro del team e l'avanzamento medio dei loro obiettivi." },
};
export type Scope = "mine" | "team";

/** Quanti giorni lavorativi futuri mostrare sempre nella pagina Daily. */
const FUTURE_DAYS = 3;

export function TasksView({
  today,
  members,
  projects,
  objectives,
  dailies,
  tab,
  initialProjectFilter,
  initialScope,
  initialLateOnly,
  currentUserId,
  currentUserRole,
}: {
  today: string;
  members: TeamMember[];
  projects: ProjectItem[];
  objectives: ObjectiveItem[];
  dailies: DailyItem[];
  tab: TasksTab;
  initialProjectFilter: string | null;
  initialScope: Scope | null;
  initialLateOnly: boolean;
  currentUserId: string;
  currentUserRole: Role;
}) {
  const router = useRouter();
  const [scope, setScope] = useState<Scope>(initialScope ?? (initialProjectFilter ? "team" : "mine"));
  const [lateOnly, setLateOnly] = useState(initialLateOnly);
  const [projectFilter, setProjectFilter] = useState<string | null>(initialProjectFilter);

  const isAdmin = currentUserRole === "ADMIN";
  const projectOptions = useMemo(() => projects.map((p) => ({ id: p.id, name: p.name })), [projects]);
  const objectiveOptions: ObjectiveOption[] = useMemo(
    () =>
      objectives
        .filter((o) => !o.reached)
        .map((o) => ({ id: o.id, title: o.title, projectName: o.project.name })),
    [objectives]
  );

  const mine = <T extends { assignee: { id: string } }>(items: T[]) =>
    scope === "mine" ? items.filter((i) => i.assignee.id === currentUserId) : items;

  const todayList = mine(dailiesForToday(dailies, today));
  const upcoming = mine(upcomingDailies(dailies, today));
  // Sempre i prossimi giorni lavorativi, anche vuoti; in mezzo, eventuali giorni
  // di fine settimana che hanno già qualcosa in programma.
  const workingDays = nextWorkingDays(today, FUTURE_DAYS);
  const horizon = workingDays[workingDays.length - 1];
  const futureDays = [...new Set([...workingDays, ...upcoming.filter((d) => d.date <= horizon).map((d) => d.date)])].sort();
  const later = upcoming.filter((d) => d.date > horizon);

  const visibleObjectives = mine(objectives).filter(
    (o) => (!projectFilter || o.project.id === projectFilter) && (!lateOnly || isObjectiveLate(o, today))
  );
  const objectivesByProject = projects
    .map((p) => ({ project: p, items: visibleObjectives.filter((o) => o.project.id === p.id) }))
    .filter((g) => g.items.length > 0);

  const shared = { members, currentUserId, currentUserRole, today };


  const addButton =
    tab === "daily" ? (
      <DailyDialog
        members={members}
        objectives={objectiveOptions}
        currentUserId={currentUserId}
        today={today}
        trigger={
          <Button size="sm">
            <Plus className="h-4 w-4" /> Nuova daily
          </Button>
        }
      />
    ) : tab === "obiettivi" ? (
      projects.length > 0 && (
        <ObjectiveDialog
          members={members}
          projects={projectOptions}
          currentUserId={currentUserId}
          defaultProjectId={projectFilter ?? undefined}
          trigger={
            <Button size="sm">
              <Plus className="h-4 w-4" /> Nuovo obiettivo
            </Button>
          }
        />
      )
    ) : (
      isAdmin && (
        <ProjectDialog
          trigger={
            <Button size="sm">
              <Plus className="h-4 w-4" /> Nuovo progetto
            </Button>
          }
        />
      )
    );

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{HEADINGS[tab].title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{HEADINGS[tab].subtitle}</p>
        </div>
        <div className="shrink-0">{addButton}</div>
      </div>

      {tab !== "progetti" && (
        <div className="inline-flex self-start rounded-xl bg-surface-muted p-1 text-xs font-medium">
          {(
            [
              ["mine", "Mie"],
              ["team", "Tutto il team"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setScope(value)}
              className={cn(
                "cursor-pointer rounded-lg px-3 py-1.5 transition-colors",
                scope === value ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* ─── Daily ─── */}
      {tab === "daily" && (
        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold text-muted-foreground">{dayHeading(today, today)}</h2>
            {todayList.length === 0 ? (
              <EmptyState icon={CalendarCheck2} message="Nessuna daily per oggi. Aggiungine una per iniziare." />
            ) : (
              <DailyList dailies={todayList} objectives={objectiveOptions} showAssignee={scope === "team"} {...shared} />
            )}
          </section>

          {futureDays.map((day) => {
            const items = upcoming.filter((d) => d.date === day);
            return (
              <section key={day} className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold text-muted-foreground">{dayHeading(day, today)}</h2>
                  <DailyDialog
                    members={members}
                    objectives={objectiveOptions}
                    currentUserId={currentUserId}
                    today={today}
                    defaultDate={day}
                    trigger={
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-muted-foreground" aria-label="Aggiungi una daily in questo giorno">
                        <Plus className="h-3.5 w-3.5" /> Aggiungi
                      </Button>
                    }
                  />
                </div>
                {items.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border px-3.5 py-3 text-xs text-muted-foreground">
                    Niente in programma.
                  </p>
                ) : (
                  <DailyList dailies={items} objectives={objectiveOptions} showAssignee={scope === "team"} {...shared} />
                )}
              </section>
            );
          })}

          {later.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold text-muted-foreground">Più avanti</h2>
              <DailyList dailies={later} objectives={objectiveOptions} showAssignee={scope === "team"} showDate {...shared} />
            </section>
          )}
        </div>
      )}

      {/* ─── Obiettivi ─── */}
      {tab === "obiettivi" && (
        <div className="flex flex-col gap-6">
          {(projectFilter || lateOnly) && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground">Filtro:</span>
              {projectFilter && <Badge variant="primary">{projects.find((p) => p.id === projectFilter)?.name}</Badge>}
              {lateOnly && <Badge variant="danger">In ritardo</Badge>}
              <button
                type="button"
                className="cursor-pointer text-xs font-medium text-accent hover:underline"
                onClick={() => {
                  setProjectFilter(null);
                  setLateOnly(false);
                  router.replace("/obiettivi");
                }}
              >
                Mostra tutti
              </button>
            </div>
          )}

          {projects.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              message={
                isAdmin
                  ? "Prima crea un progetto (scheda Progetti), poi aggiungi i suoi obiettivi."
                  : "Non ci sono ancora progetti: chiedi all'amministratore di crearne uno."
              }
            />
          ) : objectivesByProject.length === 0 ? (
            <EmptyState
              icon={Target}
              message={
                lateOnly
                  ? "Nessun obiettivo in ritardo."
                  : scope === "mine"
                    ? "Nessun obiettivo assegnato a te."
                    : "Nessun obiettivo. Creane uno per iniziare."
              }
            />
          ) : (
            objectivesByProject.map(({ project, items }) => (
              <section key={project.id} className="flex flex-col gap-2">
                <h2 className="text-sm font-semibold text-muted-foreground">{project.name}</h2>
                <ObjectiveGrid objectives={items} projects={projectOptions} objectiveOptions={objectiveOptions} {...shared} />
              </section>
            ))
          )}
        </div>
      )}

      {/* ─── Progetti ─── */}
      {tab === "progetti" && (
        <div>
          {projects.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              message={
                isAdmin
                  ? "Nessun progetto. Crea il primo, es. Produzione, Social media o Commerciale."
                  : "Non ci sono ancora progetti: li crea l'amministratore."
              }
            />
          ) : (
            <SortableList
              items={projects}
              layout="grid"
              disabled={!isAdmin}
              className="grid grid-cols-1 gap-3 md:grid-cols-2"
              onReorder={(ids) => reorderItems("project", ids)}
              renderItem={(p, handle) => <ProjectCard project={p} projects={projectOptions} dragHandle={handle} {...shared} />}
            />
          )}
        </div>
      )}
    </div>
  );
}
