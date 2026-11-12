import "server-only";
import { prisma } from "@/lib/prisma";
import { addDaysISO, dateColumnToISO, isoToDateColumn, romeISO } from "@/lib/dates";

/** Massimo di daily aperte per persona in un giorno, arretrati inclusi. */
export const MAX_DAILIES_PER_PERSON = 4;

/** Chi ha questa area ha posti in più, usabili solo per obiettivi di questo progetto. */
export const PRODUCTION_AREA = "Produzione";
export const PRODUCTION_EXTRA_SLOTS = 2;

/** Quante daily (solo create dall'agente) l'agente può rimandare a persona in una mattina. */
export const MAX_POSTPONED_PER_PERSON = 2;
/** Fin dove può rimandare, in giorni dal giorno della pianificazione. */
export const POSTPONE_HORIZON_DAYS = 7;

/** Con un'assenza solo di qualche ora (orario indicato) la persona ha al massimo questi posti. */
export const PARTIAL_ABSENCE_MAX_SLOTS = 2;

/** Posti liberi di una persona dati i suoi arretrati (totali e fuori dalla Produzione). */
export function slotsFor(hasProductionArea: boolean, backlog: number, backlogOutsideProduction: number) {
  const extra = hasProductionArea ? PRODUCTION_EXTRA_SLOTS : 0;
  const freeSlots = Math.max(0, MAX_DAILIES_PER_PERSON + extra - backlog);
  // Posti totali; quelli fuori dalla Produzione restano al massimo MAX_DAILIES_PER_PERSON.
  return {
    freeSlots,
    freeSlotsOutsideProduction: Math.min(freeSlots, Math.max(0, MAX_DAILIES_PER_PERSON - backlogOutsideProduction)),
  };
}

/** Assente tutto il giorno: nessun posto. Assente qualche ora: posti ridotti. */
export function limitSlots(
  slots: { freeSlots: number; freeSlotsOutsideProduction: number },
  absentToday: boolean,
  partlyAbsentToday: boolean,
) {
  if (absentToday) return { freeSlots: 0, freeSlotsOutsideProduction: 0 };
  if (!partlyAbsentToday) return slots;
  return {
    freeSlots: Math.min(slots.freeSlots, PARTIAL_ABSENCE_MAX_SLOTS),
    freeSlotsOutsideProduction: Math.min(slots.freeSlotsOutsideProduction, PARTIAL_ABSENCE_MAX_SLOTS),
  };
}

export const isProduction = (projectName: string | null | undefined) =>
  projectName?.trim().toLowerCase() === PRODUCTION_AREA.toLowerCase();

type AbsenceRow = {
  title: string;
  startDate: Date;
  endDate: Date;
  startTime: string | null;
  endTime: string | null;
  personId: string | null;
};

/**
 * Giorni di assenza intera e assenze di qualche ora di una persona, da oggi all'orizzonte.
 * Un'assenza senza persona (personId null) vale per tutto il team.
 */
export function absencesFor(rows: AbsenceRow[], personId: string, today: string, horizon: string) {
  const fullDays = new Set<string>();
  const partial: { date: string; from: string | null; to: string | null; reason: string }[] = [];
  for (const e of rows.filter((e) => e.personId === null || e.personId === personId)) {
    const start = dateColumnToISO(e.startDate);
    const end = dateColumnToISO(e.endDate);
    for (let day = start < today ? today : start; day <= end && day <= horizon; day = addDaysISO(day, 1)) {
      if (e.startTime || e.endTime) partial.push({ date: day, from: e.startTime, to: e.endTime, reason: e.title });
      else fullDays.add(day);
    }
  }
  return {
    absentDays: [...fullDays].sort(),
    partialAbsences: partial.filter((a) => !fullDays.has(a.date)).sort((a, b) => a.date.localeCompare(b.date)),
  };
}

/** Fotografia del team usata sia dalla pianificazione sia dalla revisione. */
export async function loadAgentContext(teamId: string, today: string) {
  const since = isoToDateColumn(addDaysISO(today, -21));

  const horizon = addDaysISO(today, POSTPONE_HORIZON_DAYS);

  const [team, members, objectives, openDailies, absenceRows] = await Promise.all([
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
      // Stesso ordine in cui il team le vede: prima quelle ordinate a mano.
      orderBy: [{ position: { sort: "asc", nulls: "last" } }, { date: "asc" }, { createdAt: "asc" }],
    }),
    // Assenze dal calendario che toccano i giorni in cui l'agente può pianificare o rimandare.
    prisma.calendarEvent.findMany({
      where: {
        teamId,
        absence: true,
        startDate: { lte: isoToDateColumn(horizon) },
        endDate: { gte: isoToDateColumn(today) },
      },
      select: { title: true, startDate: true, endDate: true, startTime: true, endTime: true, personId: true },
    }),
  ]);

  const people = members.map((m) => {
    const backlog = openDailies.filter((d) => d.assigneeId === m.id);
    const hasProductionArea = m.areas.some(isProduction);
    const otherBacklog = backlog.filter((d) => !isProduction(d.objective?.project.name)).length;
    const { absentDays, partialAbsences } = absencesFor(absenceRows, m.id, today, horizon);
    const absentToday = absentDays.includes(today);
    const partlyAbsentToday = partialAbsences.some((a) => a.date === today);
    return {
      id: m.id,
      name: m.name,
      areas: m.areas,
      // Daily ancora aperte, nell'ordine attuale (la prima è quella in cima alla lista).
      backlog: backlog.map((d) => ({
        id: d.id,
        title: d.title,
        objective: d.objective?.title ?? null,
        area: d.objective?.project.name ?? null,
        plannedFor: dateColumnToISO(d.date),
        // Solo le daily create dall'agente si possono rimandare.
        byAgent: !!d.agentRunId,
      })),
      hasProductionArea,
      absentToday,
      partlyAbsentToday,
      // Giorni (YYYY-MM-DD) in cui è assente tutto il giorno e assenze di qualche ora, da oggi in avanti.
      absentDays,
      partialAbsences,
      ...limitSlots(slotsFor(hasProductionArea, backlog.length, otherBacklog), absentToday, partlyAbsentToday),
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
      dueDate: o.dueDate ? dateColumnToISO(o.dueDate) : null,
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
