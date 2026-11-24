"use client";

import { useActionState, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { FormState } from "@/lib/types";

/** Dialog con form collegato a una server action che restituisce FormState. */
export function FormDialog({
  title,
  description,
  trigger,
  action,
  submitLabel,
  successMessage,
  defaultOpen = false,
  onClose,
  children,
}: {
  title: string;
  description?: string;
  trigger: ReactNode;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
  successMessage: string;
  /** Aperta subito (es. arrivando da un link dei Comandi rapidi). */
  defaultOpen?: boolean;
  /** Chiamata quando la finestra si chiude (salvata o annullata). */
  onClose?: () => void;
  children: (state: FormState) => ReactNode;
}) {
  const [open, setOpenState] = useState(defaultOpen);
  const setOpen = (value: boolean) => {
    setOpenState(value);
    if (!value) onClose?.();
  };
  const [state, formAction, pending] = useActionState<FormState, FormData>(async (prev, formData) => {
    const result = await action(prev, formData);
    if (result?.ok) {
      setOpen(false);
      toast.success(successMessage);
    }
    return result;
  }, undefined);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <form
          action={formAction}
          className="flex flex-col gap-4"
          onKeyDown={(e) => {
            // ⌘ Invio (Ctrl Invio su Windows) salva anche dai campi lunghi, dove Invio va a capo.
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !pending) {
              e.preventDefault();
              e.currentTarget.requestSubmit();
            }
          }}
        >
          {children(state)}
          {state?.message && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{state.message}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annulla <Kbd>Esc</Kbd>
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitLabel} <Kbd>⌘↵</Kbd>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="text-xs text-danger">{messages[0]}</p>;
}
