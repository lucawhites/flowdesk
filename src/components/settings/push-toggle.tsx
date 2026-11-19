"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { disablePush, enablePush, pushStatus, type PushStatus } from "@/lib/push-client";
import { cn } from "@/lib/utils";

const HINTS: Record<PushStatus, string> = {
  on: "Attive su questo dispositivo: daily del mattino, daily assegnate, obiettivi raggiunti.",
  off: "Spente su questo dispositivo.",
  "needs-install": "Su iPhone funzionano solo con Flowdesk aggiunta alla schermata Home (Safari › Condividi › Aggiungi alla schermata Home).",
  denied: "Bloccate: si riattivano da Impostazioni dell'iPhone › Notifiche › Flowdesk.",
  unsupported: "Questo browser non supporta le notifiche.",
};

/** Interruttore delle notifiche push di questo dispositivo (pagina Impostazioni). */
export function PushToggle() {
  const [status, setStatus] = useState<PushStatus | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    pushStatus().then(setStatus).catch(() => setStatus("unsupported"));
  }, []);

  const usable = status === "on" || status === "off";
  const toggle = async () => {
    if (!usable) return;
    setBusy(true);
    try {
      if (status === "on") {
        await disablePush();
        toast.success("Notifiche disattivate su questo dispositivo");
      } else {
        const result = await enablePush();
        if ("error" in result) toast.error(result.error);
        else toast.success("Notifiche attive: ti ho mandato una prova");
      }
    } catch {
      toast.error("Non è stato possibile cambiare le notifiche");
    } finally {
      setStatus(await pushStatus().catch(() => "unsupported" as const));
      setBusy(false);
    }
  };

  const on = status === "on";
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">Notifiche su questo dispositivo</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{status ? HINTS[status] : "…"}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label="Notifiche"
        disabled={!usable || busy}
        onClick={toggle}
        className={cn(
          "relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default disabled:opacity-50",
          on ? "bg-accent" : "bg-foreground/15"
        )}
      >
        <span
          className={cn(
            "absolute left-0.5 h-6 w-6 rounded-full bg-surface shadow-sm transition-transform duration-200",
            on && "translate-x-5"
          )}
        />
      </button>
    </div>
  );
}
