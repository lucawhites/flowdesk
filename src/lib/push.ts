import "server-only";
import webpush from "web-push";
import { prisma } from "@/lib/prisma";
import { todayISO, isoToDateColumn } from "@/lib/dates";

// Notifiche push (iPhone con Flowdesk installata, Android, computer).
// Servono tre variabili d'ambiente: NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY e
// VAPID_SUBJECT (es. "mailto:..."). Senza, l'invio non fa nulla e l'app funziona come prima.

export type PushPayload = {
  title: string;
  body: string;
  /** Pagina da aprire toccando la notifica. */
  url?: string;
  /** Stesso tag = la notifica nuova sostituisce la vecchia invece di accumularsi. */
  tag?: string;
  /** Numero da mostrare sull'icona dell'app (daily ancora da fare oggi). */
  badge?: number;
};

let configured: boolean | null = null;
function configure() {
  if (configured !== null) return configured;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  configured = !!(publicKey && privateKey && subject);
  if (configured) webpush.setVapidDetails(subject!, publicKey!, privateKey!);
  return configured;
}

export function pushEnabled() {
  return configure();
}

/** Invia a tutti i dispositivi delle persone indicate; toglie le iscrizioni scadute. */
export async function sendPush(userIds: string[], payload: PushPayload | ((userId: string) => Promise<PushPayload | null>)) {
  if (!configure() || userIds.length === 0) return;
  const subs = await prisma.pushSubscription.findMany({ where: { userId: { in: userIds } } });
  const cache = new Map<string, PushPayload | null>();
  await Promise.all(
    subs.map(async (sub) => {
      let body: PushPayload | null;
      if (typeof payload === "function") {
        if (!cache.has(sub.userId)) cache.set(sub.userId, await payload(sub.userId));
        body = cache.get(sub.userId) ?? null;
      } else {
        body = payload;
      }
      if (!body) return;
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(body),
          { TTL: 60 * 60 * 12 }
        );
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        // 404/410: il dispositivo ha revocato l'iscrizione.
        if (status === 404 || status === 410) {
          await prisma.pushSubscription.deleteMany({ where: { endpoint: sub.endpoint } });
        } else {
          console.error("Notifica push non inviata:", status ?? error);
        }
      }
    })
  );
}

/** Daily ancora da fare oggi (comprese quelle riportate dai giorni prima): è il numero sull'icona. */
export async function openDailiesToday(userId: string) {
  return prisma.daily.count({
    where: { assigneeId: userId, completedAt: null, date: { lte: isoToDateColumn(todayISO()) } },
  });
}

/** Notifica del mattino: quante daily ci sono oggi, con il numero sull'icona. */
export async function sendMorningPush(teamId: string) {
  if (!configure()) return;
  const members = await prisma.user.findMany({ where: { teamId }, select: { id: true, name: true } });
  await sendPush(
    members.map((m) => m.id),
    async (userId) => {
      const count = await openDailiesToday(userId);
      const name = members.find((m) => m.id === userId)?.name.split(" ")[0] ?? "";
      return {
        title: count > 0 ? `Buongiorno ${name}: ${count} daily per oggi` : `Buongiorno ${name}`,
        body: count > 0 ? "Apri Flowdesk per vedere da dove partire." : "Oggi non hai daily in programma.",
        url: "/daily",
        tag: "mattino",
        badge: count,
      };
    }
  );
}
