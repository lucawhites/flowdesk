"use client";

import { useEffect, useState, useTransition, type MouseEvent, type ReactNode } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { getObjectiveSteps, saveDaily, suggestDailyText } from "@/app/(app)/work-actions";
import { FieldError, FormDialog } from "@/components/form-dialog";
import { MemberSelect } from "@/components/member-select";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DAILY_DESCRIPTION_MAX,
  DAILY_INSTRUCTIONS_MAX,
  type DailyItem,
  type FormState,
  type ObjectiveOption,
  type StepOption,
  type TeamMember,
} from "@/lib/types";

export function DailyDialog({
  members,
  objectives,
  currentUserId,
  today,
  daily,
  defaultObjectiveId,
  defaultStepId,
  defaultAssigneeId,
  defaultDate,
  trigger,
}: {
  members: TeamMember[];
  objectives: ObjectiveOption[];
  currentUserId: string;
  today: string;
  daily?: DailyItem;
  defaultObjectiveId?: string;
  /** Passo già scelto (es. dal "+" accanto a un passo). */
  defaultStepId?: string;
  defaultAssigneeId?: string;
  defaultDate?: string;
  trigger: ReactNode;
}) {
  const isEdit = !!daily;

  return (
    <FormDialog
      title={isEdit ? "Modifica daily" : "Nuova daily"}
      description={isEdit ? undefined : "Una microtask per la giornata. Se non viene spuntata, si riporta al giorno dopo."}
      trigger={trigger}
      action={saveDaily.bind(null, daily?.id ?? null)}
      submitLabel={isEdit ? "Salva" : "Crea daily"}
      successMessage={isEdit ? "Daily aggiornata" : "Daily creata"}
    >
      {(state) => (
        <>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="daily-title">Cosa c&apos;è da fare</Label>
            <Input id="daily-title" name="title" placeholder="Es. Chiamare il fornitore" defaultValue={daily?.title} required autoFocus />
            <FieldError messages={state?.errors?.title} />
          </div>

          <DailyTextFields daily={daily} state={state}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="daily-date">Giorno</Label>
                <Input id="daily-date" name="date" type="date" defaultValue={daily?.date ?? defaultDate ?? today} required />
                <FieldError messages={state?.errors?.date} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="daily-assignee">Responsabile</Label>
                <MemberSelect
                  id="daily-assignee"
                  name="assigneeId"
                  members={members}
                  currentUserId={currentUserId}
                  defaultValue={daily?.assignee.id ?? defaultAssigneeId ?? currentUserId}
                />
                <FieldError messages={state?.errors?.assigneeId} />
              </div>
            </div>

            <ObjectiveAndStep
              objectives={objectives}
              initialObjectiveId={daily?.objective?.id ?? defaultObjectiveId ?? "NONE"}
              initialStepId={daily ? daily.step?.id : defaultStepId}
            />
          </DailyTextFields>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="daily-notes">Note (opzionale)</Label>
            <Textarea
              id="daily-notes"
              name="notes"
              placeholder="Dettagli utili: contatti, misure, cosa serve…"
              defaultValue={daily?.notes ?? ""}
              maxLength={2000}
            />
            <FieldError messages={state?.errors?.notes} />
          </div>
        </>
      )}
    </FormDialog>
  );
}

/**
 * Obiettivo e, se l'obiettivo ha passi, il passo a cui collegare la daily.
 * Senza un passo già scelto propone il primo non ancora fatto.
 */
function ObjectiveAndStep({
  objectives,
  initialObjectiveId,
  initialStepId,
}: {
  objectives: ObjectiveOption[];
  initialObjectiveId: string;
  /** undefined = proponi il passo corrente; null = nessun passo. */
  initialStepId: string | null | undefined;
}) {
  const [objectiveId, setObjectiveId] = useState(initialObjectiveId);
  const [steps, setSteps] = useState<{ objectiveId: string; list: StepOption[] } | null>(null);
  const [stepId, setStepId] = useState<string | null | undefined>(initialStepId);

  useEffect(() => {
    if (objectiveId === "NONE") return;
    let active = true;
    getObjectiveSteps(objectiveId).then((list) => {
      if (active) setSteps({ objectiveId, list });
    });
    return () => {
      active = false;
    };
  }, [objectiveId]);

  const list = steps?.objectiveId === objectiveId ? steps.list : null;
  const chosen =
    stepId === undefined
      ? (list?.find((s) => !s.done)?.id ?? "NONE")
      : stepId && list?.some((s) => s.id === stepId)
        ? stepId
        : "NONE";

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="daily-objective">Obiettivo</Label>
        <Select
          name="objectiveId"
          value={objectiveId}
          onValueChange={(v) => {
            setObjectiveId(v);
            setStepId(undefined); // nuovo obiettivo: riparti dal suo passo corrente
          }}
        >
          <SelectTrigger id="daily-objective">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NONE">Nessuno (daily libera)</SelectItem>
            {objectives.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.projectName} · {o.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {objectiveId !== "NONE" && list && list.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="daily-step">Passo (opzionale)</Label>
          <Select name="stepId" value={chosen} onValueChange={(v) => setStepId(v === "NONE" ? null : v)}>
            <SelectTrigger id="daily-step">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NONE">Nessun passo</SelectItem>
              {list.map((s, i) => (
                <SelectItem key={s.id} value={s.id}>
                  {i + 1}. {s.title}
                  {s.done ? " ✓" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {/* Finché i passi non sono caricati, la daily mantiene il passo che aveva. */}
      {objectiveId !== "NONE" && !list && initialStepId && objectiveId === initialObjectiveId && (
        <input type="hidden" name="stepId" value={initialStepId} />
      )}
    </>
  );
}


/**
 * Descrizione breve (in alto) e istruzioni (in basso), con i campi intermedi passati come figli:
 * condividono lo stato perché "Proponi istruzioni" le riempie entrambe.
 */
function DailyTextFields({ daily, state, children }: { daily?: DailyItem; state: FormState; children: ReactNode }) {
  const [description, setDescription] = useState(daily?.description ?? "");
  const [instructions, setInstructions] = useState(daily?.instructions ?? "");
  const [pending, startTransition] = useTransition();

  const propose = (e: MouseEvent<HTMLButtonElement>) => {
    const form = e.currentTarget.form;
    if (!form) return;
    if (instructions.trim() && !window.confirm("Sostituire le istruzioni attuali con quelle proposte dall'agente?")) return;
    const data = new FormData(form);
    const get = (name: string) => String(data.get(name) ?? "");
    startTransition(async () => {
      const result = await suggestDailyText({
        title: get("title"),
        notes: get("notes"),
        assigneeId: get("assigneeId"),
        objectiveId: get("objectiveId"),
        stepId: get("stepId"),
      });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setInstructions(result.instructions);
      // La descrizione già scritta non si tocca.
      setDescription((current) => current.trim() || result.description);
      toast.success("Istruzioni proposte: controllale e salva");
    });
  };

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="daily-description">Descrizione breve (opzionale)</Label>
        <Input
          id="daily-description"
          name="description"
          placeholder="Una riga che si vede nell'anteprima della card"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={DAILY_DESCRIPTION_MAX}
        />
        <FieldError messages={state?.errors?.description} />
      </div>

      {children}

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="daily-instructions">Istruzioni (opzionale)</Label>
          <Button type="button" variant="outline" size="sm" onClick={propose} disabled={pending}>
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {pending ? "Sto scrivendo…" : "Proponi istruzioni"}
          </Button>
        </div>
        <Textarea
          id="daily-instructions"
          name="instructions"
          placeholder="Come svolgerla, passo per passo. Puoi farle proporre all'agente."
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          maxLength={DAILY_INSTRUCTIONS_MAX}
          rows={6}
        />
        <FieldError messages={state?.errors?.instructions} />
      </div>
    </>
  );
}
