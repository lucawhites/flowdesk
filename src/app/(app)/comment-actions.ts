"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/dal";
import { sendPush } from "@/lib/push";
import { COMMENT_MAX, type CommentItem, type CommentTarget } from "@/lib/types";

type SessionUser = Awaited<ReturnType<typeof requireSessionUser>>;

const authorSelect = { select: { id: true, name: true } } as const;

function toItem(c: { id: string; body: string; createdAt: Date; author: { id: string; name: string } }, userId: string): CommentItem {
  return { id: c.id, body: c.body, createdAt: c.createdAt.toISOString(), author: c.author, mine: c.author.id === userId };
}

/** La daily o l'obiettivo, solo se è del team di chi chiede. */
async function findTarget(user: SessionUser, target: CommentTarget) {
  if (target.kind === "daily") {
    const d = await prisma.daily.findFirst({
      where: { id: target.id, teamId: user.teamId },
      select: { title: true, assigneeId: true },
    });
    return d ? { title: d.title, assigneeId: d.assigneeId, url: "/daily", label: "la daily" } : null;
  }
  const o = await prisma.objective.findFirst({
    where: { id: target.id, teamId: user.teamId },
    select: { title: true, assigneeId: true },
  });
  return o ? { title: o.title, assigneeId: o.assigneeId, url: `/obiettivi/${target.id}`, label: "l'obiettivo" } : null;
}

const targetWhere = (target: CommentTarget) =>
  target.kind === "daily" ? { dailyId: target.id } : { objectiveId: target.id };

/** Commenti di una daily o di un obiettivo, dal più vecchio al più recente. */
export async function listComments(target: CommentTarget): Promise<CommentItem[]> {
  const user = await requireSessionUser();
  if (!(await findTarget(user, target))) return [];
  const rows = await prisma.comment.findMany({
    where: targetWhere(target),
    orderBy: { createdAt: "asc" },
    select: { id: true, body: true, createdAt: true, author: authorSelect },
  });
  return rows.map((c) => toItem(c, user.id));
}

/** Aggiunge un commento e avvisa con una notifica chi è responsabile, se non è chi scrive. */
export async function addComment(target: CommentTarget, text: string): Promise<{ comment: CommentItem } | { error: string }> {
  const user = await requireSessionUser();
  const body = text.trim();
  if (!body) return { error: "Scrivi qualcosa prima di inviare." };
  if (body.length > COMMENT_MAX) return { error: `Il commento è troppo lungo (massimo ${COMMENT_MAX} caratteri).` };

  const found = await findTarget(user, target);
  if (!found) return { error: "Elemento non trovato." };

  const created = await prisma.comment.create({
    data: { body, authorId: user.id, ...targetWhere(target) },
    select: { id: true, body: true, createdAt: true, author: authorSelect },
  });

  if (found.assigneeId !== user.id) {
    const who = user.name?.split(" ")[0] ?? "Qualcuno";
    const preview = body.length > 120 ? `${body.slice(0, 117)}…` : body;
    after(async () => {
      try {
        await sendPush([found.assigneeId], {
          title: `${who} ha commentato ${found.label}`,
          body: `${found.title}: ${preview}`,
          url: found.url,
          tag: `commento-${target.id}`,
        });
      } catch (error) {
        console.error("Notifica commento non inviata:", error);
      }
    });
  }

  // Aggiorna il fumetto col numero di commenti sulle card delle daily.
  if (target.kind === "daily") revalidatePath("/", "layout");
  return { comment: toItem(created, user.id) };
}

/** Cancella un commento: solo chi l'ha scritto. */
export async function deleteComment(commentId: string): Promise<{ ok: boolean }> {
  const user = await requireSessionUser();
  const { count } = await prisma.comment.deleteMany({ where: { id: commentId, authorId: user.id } });
  if (count > 0) revalidatePath("/", "layout");
  return { ok: count > 0 };
}
