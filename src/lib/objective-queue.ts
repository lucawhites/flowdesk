import "server-only";
import { prisma } from "@/lib/prisma";
import { dateColumnToISO, todayISO } from "@/lib/dates";
import { objectiveProgressFrom } from "@/lib/progress";
import { ACTIVE_LIMIT, countsAsActive, isReadyToStart } from "@/lib/objective-status";

type Row = Awaited<ReturnType<typeof loadRows>>[number];

function loadRows(teamId: string) {
  return prisma.objective.findMany({
    where: { teamId, kind: "STANDARD", status: { in: ["ACTIVE", "QUEUED"] } },
    select: {
      id: true,
      title: true,
      status: true,
      kind: true,
      position: true,
      createdAt: true,
      startDate: true,
      assigneeId: true,
      afterId: true,
      steps: { select: { completedAt: true } },
      dailies: { select: { completedAt: true } },
      after: {
        select: { steps: { select: { completedAt: true } }, dailies: { select: { completedAt: true } } },
      },
    },
  });
}

function reachedOf(o: { steps: { completedAt: Date | null }[]; dailies: { completedAt: Date | null }[] }) {
  return objectiveProgressFrom(
    { done: o.steps.filter((s) => s.completedAt).length, total: o.steps.length },
    { done: o.dailies.filter((d) => d.completedAt).length, total: o.dailies.length },
  ).reached;
}

/** Ordine della coda: posizione scelta a mano, poi data di creazione. */
function byQueueOrder(a: Row, b: Row) {
  const pa = a.position ?? Number.MAX_SAFE_INTEGER;
  const pb = b.position ?? Number.MAX_SAFE_INTEGER;
  if (pa !== pb) return pa - pb;
  return a.createdAt.getTime() - b.createdAt.getTime();
}

export type Activated = { id: string; title: string; assigneeId: string; unlockedBy: string | null };

/**
 * Riempie i posti attivi liberi di ogni persona (massimo ACTIVE_LIMIT obiettivi normali
 * non ancora raggiunti) con i primi obiettivi in coda pronti a partire. Chi aspettava un
 * obiettivo appena concluso ("Parte dopo") passa davanti agli altri.
 * Restituisce gli obiettivi attivati, per l'email.
 */
export async function promoteQueue(teamId: string, today = todayISO()): Promise<Activated[]> {
  const rows = await loadRows(teamId);
  const titleOf = new Map(
    (
      await prisma.objective.findMany({
        where: { id: { in: rows.map((r) => r.afterId).filter((id): id is string => !!id) } },
        select: { id: true, title: true },
      })
    ).map((o) => [o.id, o.title]),
  );

  const activated: Activated[] = [];
  const people = new Set(rows.map((r) => r.assigneeId));
  for (const person of people) {
    const mine = rows.filter((r) => r.assigneeId === person);
    let active = mine.filter((r) => countsAsActive({ kind: r.kind, status: r.status, reached: reachedOf(r) })).length;
    if (active >= ACTIVE_LIMIT) continue;

    const ready = mine
      .filter((r) => r.status === "QUEUED")
      .filter((r) =>
        isReadyToStart(
          {
            startDate: r.startDate ? dateColumnToISO(r.startDate) : null,
            afterReached: r.after ? reachedOf(r.after) : null,
          },
          today,
        ),
      )
      .sort((a, b) => Number(!!b.afterId) - Number(!!a.afterId) || byQueueOrder(a, b));

    for (const r of ready) {
      if (active >= ACTIVE_LIMIT) break;
      const done = await prisma.objective.updateMany({
        where: { id: r.id, status: "QUEUED" },
        data: { status: "ACTIVE", activatedAt: new Date() },
      });
      if (done.count === 0) continue;
      active += 1;
      activated.push({
        id: r.id,
        title: r.title,
        assigneeId: r.assigneeId,
        unlockedBy: r.afterId ? (titleOf.get(r.afterId) ?? null) : null,
      });
    }
  }
  return activated;
}

/** Quanti obiettivi normali attivi (non raggiunti) ha una persona, escluso eventualmente uno. */
export async function activeCountFor(teamId: string, assigneeId: string, exceptId?: string) {
  const rows = await prisma.objective.findMany({
    where: { teamId, assigneeId, kind: "STANDARD", status: "ACTIVE", ...(exceptId ? { NOT: { id: exceptId } } : {}) },
    select: { steps: { select: { completedAt: true } }, dailies: { select: { completedAt: true } } },
  });
  return rows.filter((r) => !reachedOf(r)).length;
}
