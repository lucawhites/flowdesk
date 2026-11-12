"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/dal";
import { isoToDateColumn } from "@/lib/dates";
import { EventSchema } from "@/lib/validation";
import type { FormState } from "@/lib/types";

type SessionUser = Awaited<ReturnType<typeof requireSessionUser>>;

function refresh() {
  // Il calendario si vede nella pagina Calendario e nel riquadro della Home.
  revalidatePath("/", "layout");
}

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : undefined;
}

/** Un evento lo cambia chi l'ha creato, la persona che riguarda o l'amministratore. */
function canManage(user: SessionUser, event: { creatorId: string; personId: string | null }) {
  return user.role === "ADMIN" || event.creatorId === user.id || event.personId === user.id;
}

export async function saveEvent(eventId: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireSessionUser();

  const parsed = EventSchema.safeParse({
    title: field(formData, "title"),
    startDate: field(formData, "startDate"),
    endDate: field(formData, "endDate"),
    startTime: field(formData, "startTime"),
    endTime: field(formData, "endTime"),
    personId: field(formData, "personId") ?? "TEAM",
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const personId = parsed.data.personId === "TEAM" ? null : parsed.data.personId;
  if (personId && !(await prisma.user.findFirst({ where: { id: personId, teamId: user.teamId }, select: { id: true } }))) {
    return { message: "La persona selezionata non fa parte del team." };
  }

  const data = {
    title: parsed.data.title,
    startDate: isoToDateColumn(parsed.data.startDate),
    endDate: isoToDateColumn(parsed.data.endDate || parsed.data.startDate),
    startTime: parsed.data.startTime || null,
    endTime: parsed.data.endTime || null,
    absence: formData.get("absence") === "on",
    personId,
  };

  if (eventId) {
    const existing = await prisma.calendarEvent.findFirst({ where: { id: eventId, teamId: user.teamId } });
    if (!existing) return { message: "Evento non trovato." };
    if (!canManage(user, existing)) return { message: "Non hai i permessi per modificare questo evento." };
    await prisma.calendarEvent.update({ where: { id: eventId }, data });
  } else {
    await prisma.calendarEvent.create({ data: { ...data, teamId: user.teamId, creatorId: user.id } });
  }

  refresh();
  return { ok: true };
}

export async function deleteEvent(eventId: string) {
  const user = await requireSessionUser();
  const existing = await prisma.calendarEvent.findFirst({ where: { id: eventId, teamId: user.teamId } });
  if (!existing || !canManage(user, existing)) return;
  await prisma.calendarEvent.delete({ where: { id: eventId } });
  refresh();
}
