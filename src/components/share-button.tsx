"use client";

import { Share } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// Pulsante "Condividi": su iPhone apre il pannello di condivisione di sistema (WhatsApp, Mail, Messaggi…);
// dove non c'è, copia il testo negli appunti.
export function ShareButton({
  title,
  text,
  path,
  variant = "outline",
  size,
  className,
}: {
  title: string;
  text: string;
  /** Percorso dentro Flowdesk (es. "/obiettivi/abc"): diventa un link completo. */
  path: string;
  variant?: "outline" | "ghost";
  size?: "sm";
  className?: string;
}) {
  const share = async () => {
    const url = new URL(path, window.location.origin).toString();
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        // Annullata dall'utente: niente da fare.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      toast.success("Copiato negli appunti");
    } catch {
      toast.error("Non è stato possibile condividere");
    }
  };

  return (
    <Button type="button" variant={variant} size={size} className={className} onClick={share}>
      <Share className="h-4 w-4" /> Condividi
    </Button>
  );
}
