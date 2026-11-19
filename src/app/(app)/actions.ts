"use server";

import { signOut } from "@/auth";
import { requireSessionUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { openDailiesToday, pushEnabled, sendPush } from "@/lib/push";
import { isPaletteId } from "@/lib/palettes";

export async function logout() {
  await signOut({ redirectTo: "/login" });
}

type SubscriptionInput = { endpoint: string; keys: { p256dh: string; auth: string } };

/** Salva l'iscrizione alle notifiche di questo dispositivo e manda una notifica di prova. */
export async function savePushSubscription(sub: SubscriptionInput): Promise<{ ok: true } | { error: string }> {
  const user = await requireSessionUser();
  if (!pushEnabled()) return { error: "Le notifiche non sono ancora configurate sul server." };
  if (!sub?.endpoint?.startsWith("https://") || !sub.keys?.p256dh || !sub.keys?.auth) {
    return { error: "Iscrizione non valida." };
  }
  await prisma.pushSubscription.upsert({
    where: { endpoint: sub.endpoint },
    create: { endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth, userId: user.id },
    update: { p256dh: sub.keys.p256dh, auth: sub.keys.auth, userId: user.id },
  });
  const count = await openDailiesToday(user.id);
  await sendPush([user.id], {
    title: "Notifiche attive",
    body: "Da domani mattina ti avviso delle daily del giorno.",
    url: "/daily",
    tag: "prova",
    badge: count,
  });
  return { ok: true };
}

/** Toglie l'iscrizione di questo dispositivo. */
export async function removePushSubscription(endpoint: string) {
  const user = await requireSessionUser();
  await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: user.id } });
}

/** Palette di colori scelta in Impostazioni: vale per l'account, su tutti i dispositivi. */
export async function savePalette(palette: string): Promise<{ ok: boolean }> {
  const user = await requireSessionUser();
  if (!isPaletteId(palette)) return { ok: false };
  await prisma.user.update({ where: { id: user.id }, data: { palette } });
  return { ok: true };
}
