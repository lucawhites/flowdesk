import "server-only";
import { prisma } from "@/lib/prisma";
import { dateColumnToISO, isoToDateColumn } from "@/lib/dates";
import type { CalendarEventItem } from "@/lib/types";

/** Eventi del team che toccano almeno un giorno dell'intervallo (estremi inclusi). */
export async function getTeamEvents(teamId: string, from: string, to: string): Promise<CalendarEventItem[]> {
  const rows = await prisma.calendarEvent.findMany({
    where: { teamId, startDate: { lte: isoToDateColumn(to) }, endDate: { gte: isoToDateColumn(from) } },
    include: { person: { select: { id: true, name: true } } },
    orderBy: [{ startDate: "asc" }, { startTime: "asc" }, { createdAt: "asc" }],
  });
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    startDate: dateColumnToISO(row.startDate),
    endDate: dateColumnToISO(row.endDate),
    startTime: row.startTime,
    endTime: row.endTime,
    absence: row.absence,
    person: row.person,
    creatorId: row.creatorId,
  }));
}
