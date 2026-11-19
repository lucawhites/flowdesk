// Notifiche push dal lato del telefono/browser: attivazione, disattivazione e stato.
import { removePushSubscription, savePushSubscription } from "@/app/(app)/actions";

export type PushStatus = "unsupported" | "needs-install" | "denied" | "on" | "off";

const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent);
const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

function keyBytes(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export async function pushStatus(): Promise<PushStatus> {
  // Su iPhone le notifiche esistono solo per l'app aggiunta alla schermata Home.
  if (isIOS() && !isStandalone()) return "needs-install";
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  return sub && Notification.permission === "granted" ? "on" : "off";
}

/** Va chiamata dal tocco dell'utente (iPhone chiede il permesso solo così). */
export async function enablePush(): Promise<{ ok: true } | { error: string }> {
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!key) return { error: "Le notifiche non sono ancora configurate sul server." };
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { error: "Permesso negato: si riattiva da Impostazioni › Notifiche › Flowdesk." };
  const reg = await navigator.serviceWorker.ready;
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(key) }));
  const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
  return savePushSubscription(json);
}

export async function disablePush() {
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return;
  await removePushSubscription(sub.endpoint);
  await sub.unsubscribe();
  if ("clearAppBadge" in navigator) await navigator.clearAppBadge().catch(() => {});
}
