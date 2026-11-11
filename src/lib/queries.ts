import "server-only";
import { prisma } from "@/lib/prisma";
import { addDaysISO, dateColumnToISO, isoToDateColumn, romeISO, todayISO } from "@/lib/dates";
import { objectiveProgressFrom, projectProgress } from "@/lib/progress";
import type { DailyItem, ObjectiveItem, ProjectItem, TeamMember } from "@/lib/types";

const person = { select: { id: true, name: true } } as const;
// Prima le card ordinate a mano, poi le altre nel loro ordine naturale.
const byPosition = { position: { sort: "asc", nulls: "last" } } as const;

const dailyInclude = {
  assignee: person,
  objective: { select: { id: true, title: true, project: { select: { name: true } } } },
  step: { select: { id: true, title: true } },
} as const;

type DailyRowData = {
  id: string;
  title: string;
  notes: string | null;
  position: number | null;
  date: Date;
  completedAt: Date | null;
  creatorId: string;
  agentRunId: string | null;
  assignee: { id: string; name: string };
  objective: { id: string; title: string; project: { name: string } } | null;
  step: { id: string; title: string } | null;
};

function toDailyItem(d: DailyRowData): DailyItem {
  return {
    id: d.id,
    title: d.title,
    notes: d.notes,
    position: d.position,
    date: dateColumnToISO(d.date),
    completedOn: d.completedAt ? romeISO(d.completedAt) : null,
    assignee: d.assignee,
    creatorId: d.creatorId,
    objective: d.objective
      ? { id: d.objective.id, title: d.objective.title, projectName: d.objective.project.name }
      : null,
    step: d.step,
    byAgent: !!d.agentRunId,
  };
}

/** Tutte le daily collegate a un obiettivo (pagina di dettaglio), senza limiti di data. */
export async function getObjectiveDailies(teamId: string, objectiveId: string): Promise<DailyItem[]> {
  const rows = await prisma.daily.findMany({
    where: { teamId, objectiveId },
    include: dailyInclude,
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(toDailyItem);
}

export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  return prisma.user.findMany({
    where: { teamId },
    select: { id: true, name: true, email: true, role: true, areas: true },
    orderBy: { name: "asc" },
  });
}

/**
 * Tutto ciò che serve alle viste Daily / Obiettivi / Progetti (e a Home e Team).
 * Le daily caricate sono: quelle dell'ultima settimana in avanti più tutte le
 * non completate più vecchie (che con il carry-over sono ancora "di oggi")
 * e quelle completate negli ultimi giorni (servono ai KPI).
 */
export async function getTeamWork(teamId: string) {
  const today = todayISO();
  const windowStart = isoToDateColumn(addDaysISO(today, -7));

  const [members, projectRows, objectiveRows, dailyRows] = await Promise.all([
    getTeamMembers(teamId),
    prisma.project.findMany({ where: { teamId }, orderBy: [byPosition, { name: "asc" }] }),
    prisma.objective.findMany({
      where: { teamId },
      include: {
        assignee: person,
        project: { select: { id: true, name: true } },
        steps: { select: { id: true, position: true, title: true, completedAt: true }, orderBy: { position: "asc" } },
        dailies: {
          select: { id: true, title: true, date: true, completedAt: true, assignee: { select: { name: true } } },
          orderBy: { date: "asc" },
        },
      },
      orderBy: [byPosition, { dueDate: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }],
    }),
    prisma.daily.findMany({
      where: {
        teamId,
        OR: [{ date: { gte: windowStart } }, { completedAt: null }, { completedAt: { gte: windowStart } }],
      },
      include: dailyInclude,
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  const objectives: ObjectiveItem[] = objectiveRows.map((o) => {
    const dailyDone = o.dailies.filter((d) => d.completedAt).length;
    const stepDone = o.steps.filter((s) => s.completedAt).length;
    const { progress, reached } = objectiveProgressFrom(
      { done: stepDone, total: o.steps.length },
      { done: dailyDone, total: o.dailies.length },
    );
    return {
      id: o.id,
      title: o.title,
      description: o.description,
      dueDate: o.dueDate ? dateColumnToISO(o.dueDate) : null,
      assignee: o.assignee,
      creatorId: o.creatorId,
      project: o.project,
      dailyTotal: o.dailies.length,
      dailyDone,
      stepTotal: o.steps.length,
      stepDone,
      progress,
      reached,
      inFocus: o.inFocus,
      metric: o.metricLabel
        ? { label: o.metricLabel, unit: o.metricUnit, target: o.metricTarget, current: o.metricCurrent, approved: o.metricApproved }
        : null,
      steps: o.steps.map((s) => ({ id: s.id, position: s.position, title: s.title, done: !!s.completedAt })),
      dailies: o.dailies.map((d) => ({
        id: d.id,
        title: d.title,
        date: dateColumnToISO(d.date),
        done: !!d.completedAt,
        assigneeName: d.assignee.name,
      })),
    };
  });

  const projects: ProjectItem[] = projectRows.map((p) => {
    const own = objectives.filter((o) => o.project.id === p.id);
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      objectives: own,
      progress: projectProgress(own.map((o) => o.progress)),
    };
  });

  const dailies: DailyItem[] = dailyRows.map(toDailyItem);

  return { today, members, projects, objectives, dailies };
}
