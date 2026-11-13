"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/dal";
import { isoToDateColumn } from "@/lib/dates";
import { proposeDailyText } from "@/lib/agent/daily-text";
import { notifyIfObjectiveReached, objectiveReached } from "@/lib/notifications";
import { DailySchema, ObjectiveSchema, ProjectSchema } from "@/lib/validation";
import { AGENT_INSTRUCTIONS_MAX, HOME_TILE_IDS, PROJECT_AGENT_NOTES_MAX, MAX_STEPS, STEP_TITLE_MAX, type FormState, type StepOption } from "@/lib/types";

type SessionUser = Awaited<ReturnType<typeof requireSessionUser>>;

function refresh() {
  // Daily, Obiettivi, Progetti, Home e Team leggono tutti gli stessi dati.
  revalidatePath("/", "layout");
}

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : undefined;
}

async function isTeamMember(userId: string, teamId: string) {
  return !!(await prisma.user.findFirst({ where: { id: userId, teamId }, select: { id: true } }));
}

function canManage(user: SessionUser, item: { creatorId: string; assigneeId: string }) {
  return user.role === "ADMIN" || item.creatorId === user.id || item.assigneeId === user.id;
}

// ─── Progetti (solo amministratore) ──────────────────────────────────────────

export async function saveProject(projectId: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireSessionUser();
  if (user.role !== "ADMIN") return { message: "Solo l'amministratore può gestire i progetti." };

  const parsed = ProjectSchema.safeParse({
    name: field(formData, "name"),
    description: field(formData, "description"),
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const data = { name: parsed.data.name, description: parsed.data.description || null };

  if (projectId) {
    const updated = await prisma.project.updateMany({ where: { id: projectId, teamId: user.teamId }, data });
    if (updated.count === 0) return { message: "Progetto non trovato." };
  } else {
    await prisma.project.create({ data: { ...data, teamId: user.teamId } });
  }

  refresh();
  return { ok: true };
}

export async function deleteProject(projectId: string) {
  const user = await requireSessionUser();
  if (user.role !== "ADMIN") return;
  // Gli obiettivi del progetto vengono eliminati a cascata; le loro daily restano, libere.
  await prisma.project.deleteMany({ where: { id: projectId, teamId: user.teamId } });
  refresh();
}

// ─── Obiettivi (chiunque nel team) ───────────────────────────────────────────

export async function saveObjective(objectiveId: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireSessionUser();

  const parsed = ObjectiveSchema.safeParse({
    title: field(formData, "title"),
    description: field(formData, "description"),
    projectId: field(formData, "projectId"),
    assigneeId: field(formData, "assigneeId"),
    dueDate: field(formData, "dueDate"),
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const project = await prisma.project.findFirst({ where: { id: parsed.data.projectId, teamId: user.teamId } });
  if (!project) return { message: "Il progetto selezionato non è valido." };
  if (!(await isTeamMember(parsed.data.assigneeId, user.teamId))) {
    return { message: "Il responsabile selezionato non fa parte del team." };
  }

  const data = {
    title: parsed.data.title,
    description: parsed.data.description || null,
    projectId: parsed.data.projectId,
    assigneeId: parsed.data.assigneeId,
    dueDate: parsed.data.dueDate ? isoToDateColumn(parsed.data.dueDate) : null,
  };

  if (objectiveId) {
    const existing = await prisma.objective.findFirst({ where: { id: objectiveId, teamId: user.teamId } });
    if (!existing) return { message: "Obiettivo non trovato." };
    if (!canManage(user, existing)) return { message: "Non hai i permessi per modificare questo obiettivo." };
    await prisma.objective.update({ where: { id: objectiveId }, data });
  } else {
    // Passi facoltativi alla creazione: uno per riga.
    const steps = stepLines(field(formData, "steps") ?? "");
    if (steps.length > MAX_STEPS) return { message: `Massimo ${MAX_STEPS} passi (ne hai scritti ${steps.length}).` };
    if (steps.some((t) => t.length > STEP_TITLE_MAX)) return { message: `Ogni passo può avere al massimo ${STEP_TITLE_MAX} caratteri.` };
    await prisma.objective.create({
      data: {
        ...data,
        teamId: user.teamId,
        creatorId: user.id,
        steps: { create: steps.map((title, i) => ({ title, position: i + 1 })) },
      },
    });
  }

  refresh();
  return { ok: true };
}

/** Righe non vuote di un elenco, senza puntini o numeri messi a mano all'inizio. */
function stepLines(text: string) {
  return text
    .split("\n")
    .map((line) => line.replace(/^\s*(?:[-•*]|\d+[.)])\s*/, "").trim())
    .filter(Boolean);
}

export async function deleteObjective(objectiveId: string) {
  const user = await requireSessionUser();
  const existing = await prisma.objective.findFirst({ where: { id: objectiveId, teamId: user.teamId } });
  if (!existing || !canManage(user, existing)) return;
  // Le daily collegate restano, diventano libere (onDelete: SetNull).
  await prisma.objective.delete({ where: { id: objectiveId } });
  refresh();
}

// ─── Daily (chiunque nel team) ───────────────────────────────────────────────

export async function saveDaily(dailyId: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireSessionUser();

  const parsed = DailySchema.safeParse({
    title: field(formData, "title"),
    date: field(formData, "date"),
    assigneeId: field(formData, "assigneeId"),
    objectiveId: field(formData, "objectiveId") ?? "NONE",
    description: field(formData, "description"),
    instructions: field(formData, "instructions"),
    notes: field(formData, "notes"),
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  if (!(await isTeamMember(parsed.data.assigneeId, user.teamId))) {
    return { message: "Il responsabile selezionato non fa parte del team." };
  }

  const objectiveId = parsed.data.objectiveId === "NONE" ? null : parsed.data.objectiveId;
  if (objectiveId) {
    const objective = await prisma.objective.findFirst({ where: { id: objectiveId, teamId: user.teamId } });
    if (!objective) return { message: "L'obiettivo selezionato non è valido." };
  }
  // Passo facoltativo: deve essere dell'obiettivo scelto; senza obiettivo niente passo.
  const rawStep = field(formData, "stepId");
  const stepId = objectiveId && rawStep && rawStep !== "NONE" ? rawStep : null;
  if (stepId && !(await prisma.objectiveStep.findFirst({ where: { id: stepId, objectiveId: objectiveId! }, select: { id: true } }))) {
    return { message: "Il passo selezionato non è di questo obiettivo." };
  }

  const data = {
    title: parsed.data.title,
    date: isoToDateColumn(parsed.data.date),
    assigneeId: parsed.data.assigneeId,
    objectiveId,
    stepId,
    description: parsed.data.description || null,
    instructions: parsed.data.instructions || null,
    notes: parsed.data.notes || null,
  };

  if (dailyId) {
    const existing = await prisma.daily.findFirst({ where: { id: dailyId, teamId: user.teamId } });
    if (!existing) return { message: "Daily non trovata." };
    if (!canManage(user, existing)) return { message: "Non hai i permessi per modificare questa daily." };
    await prisma.daily.update({ where: { id: dailyId }, data });
  } else {
    await prisma.daily.create({ data: { ...data, teamId: user.teamId, creatorId: user.id } });
  }

  refresh();
  return { ok: true };
}

/**
 * Pulsante "Proponi istruzioni" nella finestra di creazione/modifica: l'agente propone
 * descrizione e istruzioni a partire da quanto inserito finora (niente viene salvato).
 */
export async function suggestDailyText(input: {
  title: string;
  notes: string;
  assigneeId: string;
  objectiveId: string;
  stepId: string;
}): Promise<{ description: string; instructions: string } | { error: string }> {
  const user = await requireSessionUser();
  const title = input.title.trim();
  if (title.length < 2) return { error: "Scrivi prima cosa c'è da fare." };
  const objectiveId = input.objectiveId && input.objectiveId !== "NONE" ? input.objectiveId : null;
  const stepId = objectiveId && input.stepId && input.stepId !== "NONE" ? input.stepId : null;
  try {
    return await proposeDailyText(user.teamId, {
      title: title.slice(0, 200),
      notes: input.notes.trim().slice(0, 2000) || null,
      assigneeId: input.assigneeId,
      objectiveId,
      stepId,
    });
  } catch (e) {
    console.error("Proposta istruzioni non riuscita:", e);
    return { error: "L'agente non ha risposto. Riprova tra poco." };
  }
}

/** Pulsante "Proponi istruzioni" nella finestra di dettaglio: propone e salva subito. */
export async function proposeDailyInstructions(dailyId: string): Promise<{ ok: true } | { error: string }> {
  const user = await requireSessionUser();
  const daily = await prisma.daily.findFirst({ where: { id: dailyId, teamId: user.teamId } });
  if (!daily) return { error: "Daily non trovata." };
  if (!canManage(user, daily)) return { error: "Non hai i permessi per modificare questa daily." };
  try {
    const text = await proposeDailyText(user.teamId, {
      title: daily.title,
      notes: daily.notes,
      assigneeId: daily.assigneeId,
      objectiveId: daily.objectiveId,
      stepId: daily.stepId,
    });
    // La descrizione già scritta da qualcuno non si tocca.
    await prisma.daily.update({
      where: { id: dailyId },
      data: { instructions: text.instructions || null, description: daily.description ?? (text.description || null) },
    });
  } catch (e) {
    console.error("Proposta istruzioni non riuscita:", e);
    return { error: "L'agente non ha risposto. Riprova tra poco." };
  }
  refresh();
  return { ok: true };
}

/** Spunta una daily; con `alsoStep` segna fatto anche il passo a cui è collegata. */
export async function toggleDaily(dailyId: string, done: boolean, alsoStep = false) {
  const user = await requireSessionUser();
  const daily = await prisma.daily.findFirst({
    where: { id: dailyId, teamId: user.teamId },
    select: { objectiveId: true, stepId: true },
  });
  if (!daily) return;
  const wasReached = done && daily.objectiveId ? await objectiveReached(daily.objectiveId) : true;
  const now = new Date();
  await prisma.daily.update({ where: { id: dailyId }, data: { completedAt: done ? now : null } });
  if (done && alsoStep && daily.stepId) {
    await prisma.objectiveStep.updateMany({ where: { id: daily.stepId, completedAt: null }, data: { completedAt: now } });
  }
  if (!wasReached) watchObjectiveReached(daily.objectiveId!, user.id);
  refresh();
}

/** Dopo la risposta all'utente: se la spunta ha portato l'obiettivo al 100%, avvisa il team. */
function watchObjectiveReached(objectiveId: string, userId: string) {
  after(async () => {
    try {
      await notifyIfObjectiveReached(objectiveId, userId);
    } catch (error) {
      console.error("Email obiettivo raggiunto non inviata:", error);
    }
  });
}

export async function deleteDaily(dailyId: string) {
  const user = await requireSessionUser();
  const existing = await prisma.daily.findFirst({ where: { id: dailyId, teamId: user.teamId } });
  if (!existing || !canManage(user, existing)) return;
  await prisma.daily.delete({ where: { id: dailyId } });
  refresh();
}

// ─── Ordine delle card ───────────────────────────────────────────────────────

/**
 * Salva l'ordine scelto trascinando le card: gli id arrivano nell'ordine nuovo.
 * L'ordine è unico per tutto il team; i progetti li riordina solo l'amministratore.
 */
export async function reorderItems(kind: "daily" | "objective" | "project", ids: string[]) {
  const user = await requireSessionUser();
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 300) return;
  if (!ids.every((id) => typeof id === "string" && id.length > 0 && id.length < 64)) return;
  if (kind === "project" && user.role !== "ADMIN") return;

  const at = (id: string, i: number) => ({ where: { id, teamId: user.teamId }, data: { position: i + 1 } });
  if (kind === "daily") await prisma.$transaction(ids.map((id, i) => prisma.daily.updateMany(at(id, i))));
  else if (kind === "objective") await prisma.$transaction(ids.map((id, i) => prisma.objective.updateMany(at(id, i))));
  else await prisma.$transaction(ids.map((id, i) => prisma.project.updateMany(at(id, i))));
  refresh();
}

/**
 * Salva l'ordine delle tessere della Home: è personale, vale solo per chi lo sceglie.
 * Arrivano gli id di un gruppo di tessere nell'ordine nuovo; gli altri restano dove sono.
 */
export async function saveHomeOrder(ids: string[]) {
  const user = await requireSessionUser();
  const known: readonly string[] = HOME_TILE_IDS;
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > known.length) return;
  if (!ids.every((id) => known.includes(id)) || new Set(ids).size !== ids.length) return;

  const current = await prisma.user.findUnique({ where: { id: user.id }, select: { homeOrder: true } });
  const others = (current?.homeOrder ?? []).filter((id) => known.includes(id) && !ids.includes(id));
  await prisma.user.update({ where: { id: user.id }, data: { homeOrder: [...others, ...ids] } });
  revalidatePath("/home");
}

// ─── Passi, metrica e focus degli obiettivi ──────────────────────────────────

async function manageableObjective(user: SessionUser, objectiveId: string) {
  const objective = await prisma.objective.findFirst({ where: { id: objectiveId, teamId: user.teamId } });
  return objective && canManage(user, objective) ? objective : null;
}

/** Passi di un obiettivo, per la scelta nella finestra della daily. */
export async function getObjectiveSteps(objectiveId: string): Promise<StepOption[]> {
  const user = await requireSessionUser();
  const steps = await prisma.objectiveStep.findMany({
    where: { objectiveId, objective: { teamId: user.teamId } },
    select: { id: true, title: true, completedAt: true },
    orderBy: { position: "asc" },
  });
  return steps.map((s) => ({ id: s.id, title: s.title, done: !!s.completedAt }));
}

/** Segna un passo come fatto / da fare (chiunque nel team, come le daily). */
export async function toggleStep(stepId: string, done: boolean) {
  const user = await requireSessionUser();
  const step = await prisma.objectiveStep.findFirst({
    where: { id: stepId, objective: { teamId: user.teamId } },
    select: { objectiveId: true },
  });
  if (!step) return;
  const wasReached = done ? await objectiveReached(step.objectiveId) : true;
  await prisma.objectiveStep.update({ where: { id: stepId }, data: { completedAt: done ? new Date() : null } });
  if (!wasReached) watchObjectiveReached(step.objectiveId, user.id);
  refresh();
}

/**
 * Salva la lista dei passi così com'è nell'editor: id esistente = aggiorna testo e
 * posizione, id null = passo nuovo, passi non più presenti = cancellati (le loro
 * daily restano, perdono solo il collegamento al passo). Lo stato "fatto" non cambia.
 */
export async function saveSteps(
  objectiveId: string,
  steps: { id: string | null; title: string }[],
): Promise<{ ok: true } | { message: string }> {
  const user = await requireSessionUser();
  if (!(await manageableObjective(user, objectiveId))) return { message: "Non hai i permessi per modificare questo obiettivo." };

  const list = steps.map((s) => ({ id: s.id, title: s.title.trim() })).filter((s) => s.title);
  if (list.length > MAX_STEPS) return { message: `Massimo ${MAX_STEPS} passi.` };
  if (list.some((s) => s.title.length > STEP_TITLE_MAX)) return { message: `Ogni passo può avere al massimo ${STEP_TITLE_MAX} caratteri.` };

  const existing = await prisma.objectiveStep.findMany({ where: { objectiveId }, select: { id: true } });
  const existingIds = new Set(existing.map((s) => s.id));
  if (list.some((s) => s.id && !existingIds.has(s.id))) return { message: "La lista dei passi è cambiata nel frattempo: ricarica la pagina." };
  const keptIds = new Set(list.map((s) => s.id).filter(Boolean));

  const wasReached = await objectiveReached(objectiveId);
  await prisma.$transaction([
    prisma.objectiveStep.deleteMany({ where: { objectiveId, id: { notIn: [...keptIds] as string[] } } }),
    ...list.map((s, i) =>
      s.id
        ? prisma.objectiveStep.update({ where: { id: s.id }, data: { title: s.title, position: i + 1 } })
        : prisma.objectiveStep.create({ data: { objectiveId, title: s.title, position: i + 1 } }),
    ),
  ]);
  // Cancellare gli ultimi passi da fare può portare l'obiettivo al 100%.
  if (!wasReached) watchObjectiveReached(objectiveId, user.id);
  refresh();
  return { ok: true };
}

/** Aggiorna il valore attuale (e il target) della metrica di risultato. */
export async function updateMetric(objectiveId: string, current: number | null, target: number | null) {
  const user = await requireSessionUser();
  if (!(await manageableObjective(user, objectiveId))) return;
  const valid = (n: number | null) => (n === null || Number.isFinite(n) ? n : null);
  await prisma.objective.update({
    where: { id: objectiveId },
    data: { metricCurrent: valid(current), metricTarget: valid(target) },
  });
  refresh();
}

/** Toglie la metrica dall'obiettivo (stessi permessi della modifica). */
export async function removeMetric(objectiveId: string) {
  const user = await requireSessionUser();
  if (!(await manageableObjective(user, objectiveId))) return;
  await prisma.objective.update({
    where: { id: objectiveId },
    data: { metricLabel: null, metricUnit: null, metricTarget: null, metricCurrent: null, metricApproved: false },
  });
  refresh();
}

/** L'amministratore approva la metrica proposta dall'agente. */
export async function approveMetric(objectiveId: string) {
  const user = await requireSessionUser();
  if (user.role !== "ADMIN") return;
  await prisma.objective.updateMany({ where: { id: objectiveId, teamId: user.teamId }, data: { metricApproved: true } });
  refresh();
}

/** Mette o toglie un obiettivo dal focus del mese seguito dall'agente (solo amministratore). */
export async function setFocus(objectiveId: string, inFocus: boolean) {
  const user = await requireSessionUser();
  if (user.role !== "ADMIN") return;
  await prisma.objective.updateMany({ where: { id: objectiveId, teamId: user.teamId }, data: { inFocus } });
  refresh();
}

/** Salva le istruzioni libere per l'agente pianificatore (solo amministratore). */
/** Note per l'agente su un singolo progetto: solo l'amministratore. */
export async function saveProjectAgentNotes(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireSessionUser();
  if (user.role !== "ADMIN") return { message: "Solo l'amministratore può istruire l'agente." };

  const projectId = field(formData, "projectId");
  const text = (field(formData, "notes") ?? "").trim();
  if (!projectId) return { message: "Progetto mancante." };
  if (text.length > PROJECT_AGENT_NOTES_MAX) {
    return { message: `Massimo ${PROJECT_AGENT_NOTES_MAX} caratteri (ora ${text.length}).` };
  }
  const { count } = await prisma.project.updateMany({
    where: { id: projectId, teamId: user.teamId },
    data: { agentNotes: text || null },
  });
  if (count === 0) return { message: "Progetto non trovato." };
  refresh();
  return { ok: true };
}

export async function saveAgentInstructions(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireSessionUser();
  if (user.role !== "ADMIN") return { message: "Solo l'amministratore può istruire l'agente." };

  const text = (field(formData, "instructions") ?? "").trim();
  if (text.length > AGENT_INSTRUCTIONS_MAX) {
    return { message: `Massimo ${AGENT_INSTRUCTIONS_MAX} caratteri (ora ${text.length}).` };
  }
  await prisma.team.update({ where: { id: user.teamId }, data: { agentInstructions: text || null } });
  refresh();
  return { ok: true };
}
