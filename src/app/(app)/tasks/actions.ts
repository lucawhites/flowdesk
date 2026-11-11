"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/dal";
import { isoToDateColumn } from "@/lib/dates";
import { DailySchema, ObjectiveSchema, ProjectSchema } from "@/lib/validation";
import type { FormState } from "@/lib/types";

type SessionUser = Awaited<ReturnType<typeof requireSessionUser>>;

function refresh() {
  revalidatePath("/tasks");
  revalidatePath("/home");
  revalidatePath("/team");
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
    await prisma.objective.create({ data: { ...data, teamId: user.teamId, creatorId: user.id } });
  }

  refresh();
  return { ok: true };
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

  const data = {
    title: parsed.data.title,
    date: isoToDateColumn(parsed.data.date),
    assigneeId: parsed.data.assigneeId,
    objectiveId,
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

export async function toggleDaily(dailyId: string, done: boolean) {
  const user = await requireSessionUser();
  await prisma.daily.updateMany({
    where: { id: dailyId, teamId: user.teamId },
    data: { completedAt: done ? new Date() : null },
  });
  refresh();
}

export async function deleteDaily(dailyId: string) {
  const user = await requireSessionUser();
  const existing = await prisma.daily.findFirst({ where: { id: dailyId, teamId: user.teamId } });
  if (!existing || !canManage(user, existing)) return;
  await prisma.daily.delete({ where: { id: dailyId } });
  refresh();
}
