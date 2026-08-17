"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/dal";
import { TaskSchema } from "@/lib/validation";

export type TaskFormState = {
  errors?: Record<string, string[]>;
  message?: string;
} | undefined;

async function assertAssigneeInTeam(assigneeId: string, teamId: string) {
  const assignee = await prisma.user.findFirst({ where: { id: assigneeId, teamId } });
  if (!assignee) {
    throw new Error("Il responsabile selezionato non fa parte del team.");
  }
}

export async function createTask(_prevState: TaskFormState, formData: FormData): Promise<TaskFormState> {
  const user = await requireSessionUser();

  const parsed = TaskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    period: formData.get("period"),
    priority: formData.get("priority"),
    dueDate: formData.get("dueDate"),
    assigneeId: formData.get("assigneeId"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await assertAssigneeInTeam(parsed.data.assigneeId, user.teamId);
  } catch {
    return { message: "Il responsabile selezionato non è valido." };
  }

  await prisma.task.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description || null,
      period: parsed.data.period,
      priority: parsed.data.priority,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      assigneeId: parsed.data.assigneeId,
      creatorId: user.id,
      teamId: user.teamId,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/home");
  revalidatePath("/team");
}

export async function updateTask(taskId: string, _prevState: TaskFormState, formData: FormData): Promise<TaskFormState> {
  const user = await requireSessionUser();

  const existing = await prisma.task.findFirst({ where: { id: taskId, teamId: user.teamId } });
  if (!existing) {
    return { message: "Task non trovata." };
  }
  if (existing.creatorId !== user.id && user.role !== "ADMIN") {
    return { message: "Non hai i permessi per modificare questa task." };
  }

  const parsed = TaskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    period: formData.get("period"),
    priority: formData.get("priority"),
    dueDate: formData.get("dueDate"),
    assigneeId: formData.get("assigneeId"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await assertAssigneeInTeam(parsed.data.assigneeId, user.teamId);
  } catch {
    return { message: "Il responsabile selezionato non è valido." };
  }

  await prisma.task.update({
    where: { id: taskId },
    data: {
      title: parsed.data.title,
      description: parsed.data.description || null,
      period: parsed.data.period,
      priority: parsed.data.priority,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      assigneeId: parsed.data.assigneeId,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/home");
  revalidatePath("/team");
}

export async function toggleTaskStatus(taskId: string, done: boolean) {
  const user = await requireSessionUser();

  const existing = await prisma.task.findFirst({ where: { id: taskId, teamId: user.teamId } });
  if (!existing) return;

  await prisma.task.update({
    where: { id: taskId },
    data: {
      status: done ? "DONE" : "TODO",
      completedAt: done ? new Date() : null,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/home");
  revalidatePath("/team");
}

export async function deleteTask(taskId: string) {
  const user = await requireSessionUser();

  const existing = await prisma.task.findFirst({ where: { id: taskId, teamId: user.teamId } });
  if (!existing) return;
  if (existing.creatorId !== user.id && user.role !== "ADMIN") return;

  await prisma.task.delete({ where: { id: taskId } });

  revalidatePath("/dashboard");
  revalidatePath("/home");
  revalidatePath("/team");
}

export async function duplicateTaskToNextPeriod(taskId: string) {
  const user = await requireSessionUser();

  const existing = await prisma.task.findFirst({ where: { id: taskId, teamId: user.teamId } });
  if (!existing) return;

  const nextDueDate = (() => {
    if (!existing.dueDate) return null;
    const date = new Date(existing.dueDate);
    if (existing.period === "DAILY") date.setDate(date.getDate() + 1);
    else if (existing.period === "WEEKLY") date.setDate(date.getDate() + 7);
    else date.setMonth(date.getMonth() + 1);
    return date;
  })();

  await prisma.task.create({
    data: {
      title: existing.title,
      description: existing.description,
      period: existing.period,
      priority: existing.priority,
      dueDate: nextDueDate,
      assigneeId: existing.assigneeId,
      creatorId: user.id,
      teamId: user.teamId,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/home");
  revalidatePath("/team");
}
