import "server-only";
import { prisma } from "@/lib/prisma";
import { addDaysISO, dateColumnToISO, isoToDateColumn, romeISO, todayISO } from "@/lib/dates";
import { objectiveProgress, projectProgress } from "@/lib/progress";
import type { DailyItem, ObjectiveItem, ProjectItem, TeamMember } from "@/lib/types";

const person = { select: { id: true, name: true } } as const;

export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  return prisma.user.findMany({
    where: { teamId },
    select: { id: true, name: true, email: true, role: true },
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
    prisma.project.findMany({ where: { teamId }, orderBy: { name: "asc" } }),
    prisma.objective.findMany({
      where: { teamId },
      include: {
        assignee: person,
        project: { select: { id: true, name: true } },
        dailies: {
          select: { id: true, title: true, date: true, completedAt: true, assignee: { select: { name: true } } },
          orderBy: { date: "asc" },
        },
      },
      orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }],
    }),
    prisma.daily.findMany({
      where: {
        teamId,
        OR: [{ date: { gte: windowStart } }, { completedAt: null }, { completedAt: { gte: windowStart } }],
      },
      include: {
        assignee: person,
        objective: { select: { id: true, title: true, project: { select: { name: true } } } },
      },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  const objectives: ObjectiveItem[] = objectiveRows.map((o) => {
    const dailyDone = o.dailies.filter((d) => d.completedAt).length;
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
      progress: objectiveProgress(dailyDone, o.dailies.length),
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

  const dailies: DailyItem[] = dailyRows.map((d) => ({
    id: d.id,
    title: d.title,
    date: dateColumnToISO(d.date),
    completedOn: d.completedAt ? romeISO(d.completedAt) : null,
    assignee: d.assignee,
    creatorId: d.creatorId,
    objective: d.objective
      ? { id: d.objective.id, title: d.objective.title, projectName: d.objective.project.name }
      : null,
  }));

  return { today, members, projects, objectives, dailies };
}
