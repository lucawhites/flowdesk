"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Check, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { saveSteps } from "@/app/(app)/work-actions";
import { SortableList } from "@/components/sortable-list";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MAX_STEPS, STEP_TITLE_MAX, type ObjectiveStepItem } from "@/lib/types";

/** Riga dell'editor: `id` serve al trascinamento, `stepId` è null per i passi nuovi. */
type Row = { id: string; stepId: string | null; title: string; done: boolean; dailies: number };

let counter = 0;
const newKey = () => `new-${++counter}`;

const toRows = (steps: ObjectiveStepItem[]): Row[] =>
  steps.map((s) => ({ id: s.id, stepId: s.id, title: s.title, done: s.done, dailies: s.dailies }));

/** Finestra per aggiungere, correggere, cancellare e riordinare i passi di un obiettivo. */
export function StepsEditor({
  objectiveId,
  objectiveTitle,
  steps,
  trigger,
}: {
  objectiveId: string;
  objectiveTitle: string;
  steps: ObjectiveStepItem[];
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[]>(() => toRows(steps));
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onOpenChange(next: boolean) {
    // A ogni apertura si riparte dai passi salvati.
    if (next) {
      setRows(toRows(steps));
      setDraft("");
      setError(null);
    }
    setOpen(next);
  }

  function add() {
    const title = draft.trim();
    if (!title) return;
    setRows((r) => [...r, { id: newKey(), stepId: null, title, done: false, dailies: 0 }]);
    setDraft("");
  }

  function save() {
    // Un passo scritto nel campo "nuovo" ma non ancora aggiunto vale lo stesso.
    const all = draft.trim() ? [...rows, { id: newKey(), stepId: null, title: draft.trim(), done: false, dailies: 0 }] : rows;
    const kept = all.filter((r) => r.title.trim());
    const removed = steps.filter((s) => !kept.some((r) => r.stepId === s.id));
    const linked = removed.reduce((n, s) => n + s.dailies, 0);
    if (linked > 0) {
      const which = removed.filter((s) => s.dailies > 0).map((s) => `«${s.title}»`).join(", ");
      const ok = window.confirm(
        `Stai cancellando ${which}: ${linked === 1 ? "c'è 1 daily collegata" : `ci sono ${linked} daily collegate`}. ` +
          "Le daily restano, perdono solo il collegamento al passo. Continuare?",
      );
      if (!ok) return;
    }
    startTransition(async () => {
      const result = await saveSteps(
        objectiveId,
        kept.map((r) => ({ id: r.stepId, title: r.title })),
      );
      if ("message" in result) {
        setError(result.message);
        return;
      }
      setOpen(false);
      toast.success("Passi salvati");
    });
  }

  const full = rows.length >= MAX_STEPS;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Passi dell&apos;obiettivo</DialogTitle>
          <DialogDescription>
            {objectiveTitle}. Correggi il testo, trascina la maniglia per cambiare l&apos;ordine, cestino per cancellare.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {rows.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
              Nessun passo. Scrivi il primo qui sotto.
            </p>
          ) : (
            <SortableList
              items={rows}
              className="flex flex-col gap-1.5"
              onReorder={async (ids) => {
                setRows((r) => ids.map((id) => r.find((row) => row.id === id)!).filter(Boolean));
              }}
              renderItem={(row, handle) => (
                <div className="flex items-center gap-1.5 rounded-lg bg-surface px-1">
                  {handle}
                  <span className="w-5 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                    {rows.indexOf(row) + 1}.
                  </span>
                  <Input
                    value={row.title}
                    maxLength={STEP_TITLE_MAX}
                    aria-label={`Passo ${rows.indexOf(row) + 1}`}
                    onChange={(e) =>
                      setRows((r) => r.map((x) => (x.id === row.id ? { ...x, title: e.target.value } : x)))
                    }
                    className={cn("h-9", row.done && "text-muted-foreground line-through")}
                  />
                  {row.done && (
                    <span title="Passo già fatto" className="shrink-0 text-success">
                      <Check className="h-4 w-4" />
                    </span>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Cancella il passo ${rows.indexOf(row) + 1}`}
                    onClick={() => setRows((r) => r.filter((x) => x.id !== row.id))}
                    className="h-9 w-9 shrink-0 text-muted-foreground hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            />
          )}

          <div className="flex items-center gap-2">
            <Input
              value={draft}
              maxLength={STEP_TITLE_MAX}
              disabled={full}
              placeholder={full ? `Massimo ${MAX_STEPS} passi` : "Nuovo passo"}
              aria-label="Nuovo passo"
              enterKeyHint="done"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  add();
                }
              }}
              className="h-9"
            />
            <Button type="button" variant="secondary" size="sm" onClick={add} disabled={full || !draft.trim()}>
              <Plus className="h-4 w-4" /> Aggiungi
            </Button>
          </div>

          {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Annulla
          </Button>
          <Button type="button" onClick={save} disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Salva passi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
