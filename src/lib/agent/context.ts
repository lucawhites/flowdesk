import "server-only";
import { prisma } from "@/lib/prisma";
import { addDaysISO, dateColumnToISO, isoToDateColumn, romeISO } from "@/lib/dates";

/** Massimo di daily aperte per persona in un giorno, arretrati inclusi. */
export const MAX_DAILIES_PER_PERSON = 4;

/** Chi ha questa area ha posti in più, usabili solo per obiettivi di questo progetto. */
export const PRODUCTION_AREA = "Produzione";
export const PRODUCTION_EXTRA_SLOTS = 2;

export const isProduction = (projectName: string | null | undefined) =>
  projectName?.trim().toLowerCase() === PRODUCTION_AREA.toLowerCase();

/** Fotografia del team usata sia dalla pianificazione sia dalla revisione. */
export async function loadAgentContext(teamId: string, today: string) {
  const since = isoToDateColumn(addDaysISO(today, -21));

  const [team, members, objectives, openDailies] = await Promise.all([
    prisma.team.findUnique({ where: { id: teamId }, select: { agentInstructions: true } }),
    prisma.user.findMany({
      where: { teamId },
      select: { id: true, name: true, areas: true, role: true },
      orderBy: { name: "asc" },
    }),
    prisma.objective.findMany({
      where: { teamId, inFocus: true },
      include: {
        project: { select: { name: true } },
        assignee: { select: { id: true, name: true } },
        steps: { orderBy: { position: "asc" } },
        dailies: {
          where: { OR: [{ date: { gte: since } }, { completedAt: { gte: since } }] },
          include: { assignee: { select: { name: true } }, step: { select: { position: true } } },
          orderBy: { date: "asc" },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    // Arretrati: daily non completate pianificate fino a oggi (con il carry-over sono "di oggi").
    prisma.daily.findMany({
      where: { teamId, completedAt: null, date: { lte: isoToDateColumn(today) } },
      include: { objective: { select: { title: true, project: { select: { name: true } } } } },
      orderBy: { date: "asc" },
    }),
  ]);

  const people = members.map((m) => {
    const backlog = openDailies.filter((d) => d.assigneeId === m.id);
    const extra = m.areas.some(isProduction) ? PRODUCTION_EXTRA_SLOTS : 0;
    const otherBacklog = backlog.filter((d) => !isProduction(d.objective?.project.name)).length;
    const freeSlots = Math.max(0, MAX_DAILIES_PER_PERSON + extra - backlog.length);
    return {
      id: m.id,
      name: m.name,
      areas: m.areas,
      backlog: backlog.map((d) => ({ title: d.title, objective: d.objective?.title ?? null, plannedFor: dateColumnToISO(d.date) })),
      // Posti totali; quelli fuori dalla Produzione restano al massimo MAX_DAILIES_PER_PERSON.
      freeSlots,
      freeSlotsOutsideProduction: Math.min(freeSlots, Math.max(0, MAX_DAILIES_PER_PERSON - otherBacklog)),
    };
  });

  const focus = objectives.map((o) => {
    const current = o.steps.find((s) => !s.completedAt) ?? null;
    const lastDone = o.dailies
      .filter((d) => d.completedAt)
      .map((d) => romeISO(d.completedAt!))
      .sort()
      .at(-1);
    return {
      id: o.id,
      title: o.title,
      area: o.project.name,
      owner: o.assignee.name,
      ownerId: o.assignee.id,
      metric: o.metricLabel
        ? { label: o.metricLabel, current: o.metricCurrent, target: o.metricTarget, unit: o.metricUnit }
        : null,
      steps: o.steps.map((s) => ({
        id: s.id,
        position: s.position,
        title: s.title,
        done: !!s.completedAt,
        completedOn: s.completedAt ? romeISO(s.completedAt) : null,
      })),
      currentStepId: current?.id ?? null,
      lastCompletedDaily: lastDone ?? null,
      recentDailies: o.dailies.map((d) => ({
        title: d.title,
        assignee: d.assignee.name,
        plannedFor: dateColumnToISO(d.date),
        done: d.completedAt ? romeISO(d.completedAt) : null,
        step: d.step?.position ?? null,
      })),
    };
  });

  const admin = members.find((m) => m.role === "ADMIN") ?? members[0];
  return { people, focus, adminId: admin.id, instructions: team?.agentInstructions?.trim() || null };
}

export type AgentContext = Awaited<ReturnType<typeof loadAgentContext>>;
