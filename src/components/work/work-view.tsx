"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck2, FolderKanban, Plus, Target } from "lucide-react";
import { DailyDialog } from "@/components/daily-dialog";
import { DailyRow } from "@/components/daily-item";
import { EmptyState } from "@/components/empty-state";
import { ObjectiveCard } from "@/components/objective-card";
import { ObjectiveDialog } from "@/components/objective-dialog";
import { ProjectCard } from "@/components/project-card";
import { ProjectDialog } from "@/components/project-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatISO, relativeDayLabel } from "@/lib/dates";
import { dailiesForToday, sortDailies, upcomingDailies } from "@/lib/daily-helpers";
import { cn } from "@/lib/utils";
import type { DailyItem, ObjectiveItem, ObjectiveOption, ProjectItem, Role, TeamMember } from "@/lib/types";

export type TasksTab = "daily" | "obiettivi" | "progetti";

const HEADINGS: Record<TasksTab, { title: string; subtitle: string }> = {
  daily: { title: "Daily", subtitle: "Le microtask di oggi e dei prossimi giorni. Quelle non spuntate passano al giorno dopo." },
  obiettivi: { title: "Obiettivi", subtitle: "Ogni obiettivo avanza con le daily completate che gli sono collegate." },
  progetti: { title: "Progetti", subtitle: "Le aree di lavoro del team e l'avanzamento medio dei loro obiettivi." },
};
type Scope = "mine" | "team";

export function TasksView({
  today,
  members,
  projects,
  objectives,
  dailies,
  tab,
  initialProjectFilter,
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
  currentUserId: string;
  currentUserRole: Role;
}) {
  const router = useRouter();
  const [scope, setScope] = useState<Scope>(initialProjectFilter ? "team" : "mine");
  const [projectFilter, setProjectFilter] = useState<string | null>(initialProjectFilter);

  const isAdmin = currentUserRole === "ADMIN";
  const projectOptions = useMemo(() => projects.map((p) => ({ id: p.id, name: p.name })), [projects]);
  const objectiveOptions: ObjectiveOption[] = useMemo(
    () =>
      objectives
        .filter((o) => o.progress < 100 || o.dailyTotal === 0)
        .map((o) => ({ id: o.id, title: o.title, projectName: o.project.name })),
    [objectives]
  );

  const mine = <T extends { assignee: { id: string } }>(items: T[]) =>
    scope === "mine" ? items.filter((i) => i.assignee.id === currentUserId) : items;

  const todayList = sortDailies(mine(dailiesForToday(dailies, today)));
  const upcoming = mine(upcomingDailies(dailies, today));
  const upcomingByDay = upcoming.reduce<Record<string, DailyItem[]>>((acc, d) => {
    (acc[d.date] ??= []).push(d);
    return acc;
  }, {});

  const visibleObjectives = mine(objectives).filter((o) => !projectFilter || o.project.id === projectFilter);
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
            <h2 className="text-sm font-semibold text-muted-foreground">
              Oggi · {formatISO(today, "EEEE d MMMM")}
            </h2>
            {todayList.length === 0 ? (
              <EmptyState icon={CalendarCheck2} message="Nessuna daily per oggi. Aggiungine una per iniziare." />
            ) : (
              todayList.map((d) => (
                <DailyRow key={d.id} daily={d} objectives={objectiveOptions} showAssignee={scope === "team"} {...shared} />
              ))
            )}
          </section>

          {Object.entries(upcomingByDay).map(([day, items]) => (
            <section key={day} className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold text-muted-foreground">{relativeDayLabel(day, today)}</h2>
              {sortDailies(items).map((d) => (
                <DailyRow key={d.id} daily={d} objectives={objectiveOptions} showAssignee={scope === "team"} {...shared} />
              ))}
            </section>
          ))}
        </div>
      )}

      {/* ─── Obiettivi ─── */}
      {tab === "obiettivi" && (
        <div className="flex flex-col gap-6">
          {projectFilter && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Progetto:</span>
              <Badge variant="primary">{projects.find((p) => p.id === projectFilter)?.name}</Badge>
              <button
                type="button"
                className="cursor-pointer text-xs font-medium text-accent hover:underline"
                onClick={() => {
                  setProjectFilter(null);
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
              message={scope === "mine" ? "Nessun obiettivo assegnato a te." : "Nessun obiettivo. Creane uno per iniziare."}
            />
          ) : (
            objectivesByProject.map(({ project, items }) => (
              <section key={project.id} className="flex flex-col gap-2">
                <h2 className="text-sm font-semibold text-muted-foreground">{project.name}</h2>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {items.map((o) => (
                    <ObjectiveCard
                      key={o.id}
                      objective={o}
                      projects={projectOptions}
                      objectiveOptions={objectiveOptions}
                      {...shared}
                    />
                  ))}
                </div>
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
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {projects.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  projects={projectOptions}
                  onShowObjectives={() => router.push(`/obiettivi?progetto=${p.id}`)}
                  {...shared}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
