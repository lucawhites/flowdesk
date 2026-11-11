"use client";

import { useMemo, useState } from "react";
import { CalendarCheck2, FolderKanban, Plus, Target } from "lucide-react";
import { DailyDialog } from "@/components/daily-dialog";
import { DailyRow, EmptyState } from "@/components/daily-item";
import { ObjectiveCard } from "@/components/objective-card";
import { ObjectiveDialog } from "@/components/objective-dialog";
import { ProjectCard } from "@/components/project-card";
import { ProjectDialog } from "@/components/project-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatISO, relativeDayLabel } from "@/lib/dates";
import { dailiesForToday, sortDailies, upcomingDailies } from "@/lib/daily-helpers";
import { cn } from "@/lib/utils";
import type { DailyItem, ObjectiveItem, ObjectiveOption, ProjectItem, Role, TeamMember } from "@/lib/types";

export type TasksTab = "daily" | "obiettivi" | "progetti";
type Scope = "mine" | "team";

export function TasksView({
  today,
  members,
  projects,
  objectives,
  dailies,
  initialTab,
  currentUserId,
  currentUserRole,
}: {
  today: string;
  members: TeamMember[];
  projects: ProjectItem[];
  objectives: ObjectiveItem[];
  dailies: DailyItem[];
  initialTab: TasksTab;
  currentUserId: string;
  currentUserRole: Role;
}) {
  const [tab, setTab] = useState<TasksTab>(initialTab);
  const [scope, setScope] = useState<Scope>("mine");
  const [projectFilter, setProjectFilter] = useState<string | null>(null);

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
  const todayPending = todayList.filter((d) => d.completedOn === null).length;
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

  function changeTab(value: string) {
    setTab(value as TasksTab);
    const url = new URL(window.location.href);
    url.searchParams.set("vista", value);
    window.history.replaceState(null, "", url);
  }

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
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Task</h1>
          <p className="text-sm text-muted-foreground">Progetti, obiettivi e le daily che li fanno avanzare.</p>
        </div>
        {addButton}
      </div>

      <Tabs value={tab} onValueChange={changeTab}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="daily" className="flex items-center gap-2">
              Daily
              {todayPending > 0 && (
                <Badge variant={tab === "daily" ? "primary" : "neutral"} className="px-1.5">
                  {todayPending}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="obiettivi">Obiettivi</TabsTrigger>
            <TabsTrigger value="progetti">Progetti</TabsTrigger>
          </TabsList>

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
        </div>

        {/* ─── Daily ─── */}
        <TabsContent value="daily" className="flex flex-col gap-6">
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
        </TabsContent>

        {/* ─── Obiettivi ─── */}
        <TabsContent value="obiettivi" className="flex flex-col gap-6">
          {projectFilter && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Progetto:</span>
              <Badge variant="primary">{projects.find((p) => p.id === projectFilter)?.name}</Badge>
              <button
                type="button"
                className="cursor-pointer text-xs font-medium text-primary hover:underline"
                onClick={() => setProjectFilter(null)}
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
        </TabsContent>

        {/* ─── Progetti ─── */}
        <TabsContent value="progetti">
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
                  onShowObjectives={() => {
                    setProjectFilter(p.id);
                    setScope("team");
                    changeTab("obiettivi");
                  }}
                  {...shared}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
