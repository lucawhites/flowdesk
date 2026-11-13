import "server-only";
import { prisma } from "@/lib/prisma";
import { addDaysISO, dateColumnToISO, isoToDateColumn, romeISO } from "@/lib/dates";
import { objectiveProgressFrom } from "@/lib/progress";
import { isReadyToStart, QUEUE_LOOKAHEAD } from "@/lib/objective-status";

/** Fra quanti giorni una scadenza di un obiettivo in coda va segnalata. */
const QUEUE_DEADLINE_WARNING_DAYS = 21;

/** Massimo di daily aperte per persona in un giorno, arretrati inclusi. */
export const MAX_DAILIES_PER_PERSON = 4;

/**
 * Aree con posti riservati: chi ha l'area ha questi posti in più, usabili solo per
 * obiettivi del progetto con lo stesso nome. Le sue daily di quell'area occupano prima
 * i posti riservati, poi quelli normali.
 */
export const RESERVED_SLOTS: Record<string, number> = { Produzione: 2, GFP: 2, Sales: 2 };

/** Quante daily (solo create dall'agente) l'agente può rimandare a persona in una mattina. */
export const MAX_POSTPONED_PER_PERSON = 2;
/** Fin dove può rimandare, in giorni dal giorno della pianificazione. */
export const POSTPONE_HORIZON_DAYS = 7;

/** Con un'assenza solo di qualche ora (orario indicato) la persona ha al massimo questi posti. */
export const PARTIAL_ABSENCE_MAX_SLOTS = 2;

export type Slots = {
  /** Posti liberi in tutto. */
  freeSlots: number;
  /** Posti liberi usabili per qualsiasi area. */
  freeSlotsGeneral: number;
  /** Posti liberi riservati, per area (solo le aree riservate della persona). */
  reservedSlots: Record<string, number>;
};

/** Nome canonico dell'area riservata a cui appartiene un progetto, se c'è. */
export function reservedAreaOf(projectName: string | null | undefined) {
  const name = projectName?.trim().toLowerCase();
  return Object.keys(RESERVED_SLOTS).find((a) => a.toLowerCase() === name) ?? null;
}

/** Posti liberi di una persona date le sue aree e le aree dei suoi arretrati. */
export function slotsFor(personAreas: string[], backlogAreas: (string | null | undefined)[]): Slots {
  const mine = new Set(personAreas.map(reservedAreaOf).filter((a): a is string => !!a));
  const used = new Map<string, number>();
  let general = 0;
  for (const project of backlogAreas) {
    const area = reservedAreaOf(project);
    if (area && mine.has(area)) used.set(area, (used.get(area) ?? 0) + 1);
    else general += 1;
  }
  const reservedSlots: Record<string, number> = {};
  for (const area of mine) {
    const n = used.get(area) ?? 0;
    reservedSlots[area] = Math.max(0, RESERVED_SLOTS[area] - n);
    general += Math.max(0, n - RESERVED_SLOTS[area]); // oltre i riservati occupano posti normali
  }
  const freeSlotsGeneral = Math.max(0, MAX_DAILIES_PER_PERSON - general);
  const freeSlots = freeSlotsGeneral + Object.values(reservedSlots).reduce((s, n) => s + n, 0);
  return { freeSlots, freeSlotsGeneral, reservedSlots };
}

/** Assente tutto il giorno: nessun posto. Assente qualche ora: posti ridotti. */
export function limitSlots(slots: Slots, absentToday: boolean, partlyAbsentToday: boolean): Slots {
  const cap = absentToday ? 0 : partlyAbsentToday ? PARTIAL_ABSENCE_MAX_SLOTS : Infinity;
  if (cap === Infinity) return slots;
  return {
    freeSlots: Math.min(slots.freeSlots, cap),
    freeSlotsGeneral: Math.min(slots.freeSlotsGeneral, cap),
    reservedSlots: Object.fromEntries(Object.entries(slots.reservedSlots).map(([a, n]) => [a, Math.min(n, cap)])),
  };
}

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

/** Lunghezza massima della descrizione di un obiettivo passata all'agente. */
const OBJECTIVE_DESCRIPTION_FOR_AGENT = 500;

function clip(text: string | null, max: number) {
  const t = text?.trim();
  if (!t) return null;
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
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
    // Attivi (normali, routine, consegne) e in coda; gli ombrelli non generano daily.
    prisma.objective.findMany({
      where: { teamId, status: { in: ["ACTIVE", "QUEUED"] }, kind: { not: "UMBRELLA" } },
      include: {
        project: { select: { name: true, agentNotes: true } },
        assignee: { select: { id: true, name: true } },
        steps: { orderBy: { position: "asc" } },
        after: { select: { title: true, steps: { select: { completedAt: true } }, dailies: { select: { completedAt: true } } } },
        dailies: {
          where: { OR: [{ date: { gte: since } }, { completedAt: { gte: since } }] },
          include: { assignee: { select: { name: true } }, step: { select: { position: true } } },
          orderBy: { date: "asc" },
        },
      },
      orderBy: [{ position: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }],
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
      absentToday,
      partlyAbsentToday,
      // Giorni (YYYY-MM-DD) in cui è assente tutto il giorno e assenze di qualche ora, da oggi in avanti.
      absentDays,
      partialAbsences,
      ...limitSlots(
        slotsFor(
          m.areas,
          backlog.map((d) => d.objective?.project.name),
        ),
        absentToday,
        partlyAbsentToday,
      ),
    };
  });

  // Che ruolo ha ogni obiettivo nella pianificazione di oggi.
  const reached = (o: { steps: { completedAt: Date | null }[]; dailies: { completedAt: Date | null }[] }) =>
    objectiveProgressFrom(
      { done: o.steps.filter((s) => s.completedAt).length, total: o.steps.length },
      { done: o.dailies.filter((d) => d.completedAt).length, total: o.dailies.length },
    ).reached;
  const started = (o: (typeof objectives)[number]) => !o.startDate || dateColumnToISO(o.startDate) <= today;
  const roleOf = new Map<string, "attivo" | "routine" | "consegna" | "coda">();
  for (const o of objectives) {
    if (o.status !== "ACTIVE" || !started(o)) continue;
    if (o.kind === "ROUTINE") roleOf.set(o.id, "routine");
    else if (reached(o)) continue;
    else roleOf.set(o.id, o.kind === "DELIVERY" ? "consegna" : "attivo");
  }
  // In coda: per persona, i primi pronti a partire nell'ordine della coda (prima chi è appena sbloccato).
  const queued = objectives.filter((o) => o.kind === "STANDARD" && o.status === "QUEUED");
  for (const m of members) {
    queued
      .filter((o) => o.assigneeId === m.id && isReadyToStart({ startDate: o.startDate ? dateColumnToISO(o.startDate) : null, afterReached: o.after ? reached(o.after) : null }, today))
      .slice(0, QUEUE_LOOKAHEAD)
      .forEach((o) => roleOf.set(o.id, "coda"));
  }
  // Scadenze vicine di obiettivi in coda che l'agente non può ancora far avanzare: solo da segnalare.
  const deadlineHorizon = addDaysISO(today, QUEUE_DEADLINE_WARNING_DAYS);
  const queueDeadlines = queued
    .filter((o) => !roleOf.has(o.id) && o.dueDate && dateColumnToISO(o.dueDate) <= deadlineHorizon)
    .map((o) => ({
      title: o.title,
      owner: o.assignee.name,
      dueDate: dateColumnToISO(o.dueDate!),
      waitingFor: o.after && !reached(o.after) ? o.after.title : null,
      startDate: o.startDate ? dateColumnToISO(o.startDate) : null,
    }));

  const planned = objectives.filter((o) => roleOf.has(o.id)).map((o) => {
    const current = o.steps.find((s) => !s.completedAt) ?? null;
    const lastDone = o.dailies
      .filter((d) => d.completedAt)
      .map((d) => romeISO(d.completedAt!))
      .sort()
      .at(-1);
    return {
      id: o.id,
      title: o.title,
      role: roleOf.get(o.id)!,
      cadence: o.kind === "ROUTINE" ? o.cadence : null,
      description: clip(o.description, OBJECTIVE_DESCRIPTION_FOR_AGENT),
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

  // Note dell'amministratore, solo per i progetti degli obiettivi pianificabili oggi.
  const projectNotes: Record<string, string> = {};
  for (const o of objectives.filter((x) => roleOf.has(x.id))) {
    const notes = o.project.agentNotes?.trim();
    if (notes) projectNotes[o.project.name] = notes;
  }

  const admin = members.find((m) => m.role === "ADMIN") ?? members[0];
  return { people, objectives: planned, queueDeadlines, projectNotes, adminId: admin.id, instructions: team?.agentInstructions?.trim() || null };
}

export type AgentContext = Awaited<ReturnType<typeof loadAgentContext>>;
