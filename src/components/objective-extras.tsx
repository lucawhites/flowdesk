"use client";

import { useOptimistic, useState, useTransition, type ReactNode } from "react";
import { Check, Gauge, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { approveMetric, removeMetric, toggleStep, updateMetric } from "@/app/(app)/work-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ObjectiveMetric, ObjectiveStepItem } from "@/lib/types";

const fmt = (n: number | null) => (n === null ? "—" : n.toLocaleString("it-IT"));

/** Passi dell'obiettivo: da questi si calcola l'avanzamento. */
export function StepList({
  steps,
  addDaily,
}: {
  steps: ObjectiveStepItem[];
  /** Pulsante facoltativo accanto a ogni passo per creare una daily già collegata. */
  addDaily?: (step: ObjectiveStepItem) => ReactNode;
}) {
  return (
    <ol className="flex flex-col gap-1">
      {steps.map((step) => (
        <StepRow key={step.id} step={step} extra={addDaily?.(step)} />
      ))}
    </ol>
  );
}

function StepRow({ step, extra }: { step: ObjectiveStepItem; extra?: ReactNode }) {
  const [, startTransition] = useTransition();
  const [done, setDone] = useOptimistic(step.done);
  return (
    <li className="flex items-start gap-1">
      <button
        type="button"
        onClick={() =>
          startTransition(async () => {
            setDone(!done);
            await toggleStep(step.id, !done);
          })
        }
        className="flex w-full items-start gap-2 rounded-md px-1 py-0.5 text-left text-xs hover:bg-surface-muted"
        aria-label={done ? `Segna da fare: ${step.title}` : `Segna fatto: ${step.title}`}
      >
        <span
          className={cn(
            "mt-px flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border",
            done ? "border-success bg-success text-white" : "border-border"
          )}
        >
          {done && <Check className="h-2.5 w-2.5" />}
        </span>
        <span className={cn("min-w-0 flex-1", done ? "text-muted-foreground line-through" : "text-foreground")}>
          {step.position}. {step.title}
        </span>
      </button>
      {extra}
    </li>
  );
}

/** Metrica di risultato: informativa, non entra nell'avanzamento. */
export function MetricBox({
  objectiveId,
  metric,
  canEdit,
  isAdmin,
}: {
  objectiveId: string;
  metric: ObjectiveMetric;
  canEdit: boolean;
  isAdmin: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const ratio = metric.target && metric.current !== null ? Math.min(100, Math.round((metric.current / metric.target) * 100)) : null;

  return (
    <div className="rounded-lg bg-surface-muted px-3 py-2 text-xs">
      <div className="flex items-center gap-2">
        <Gauge className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 text-muted-foreground">
          {metric.label}
          {!metric.approved && <span className="ml-1 text-warning">· proposta, da approvare</span>}
        </span>
        {!editing && (
          <button
            type="button"
            disabled={!canEdit}
            onClick={() => setEditing(true)}
            className="shrink-0 font-semibold text-foreground enabled:hover:underline"
          >
            {fmt(metric.current)} / {fmt(metric.target)} {metric.unit}
            {ratio !== null && <span className="ml-1 font-normal text-muted-foreground">({ratio}%)</span>}
          </button>
        )}
      </div>

      {editing && (
        <form
          className="mt-2 flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            const num = (k: string) => {
              const v = String(form.get(k) ?? "").replace(",", ".").trim();
              return v === "" ? null : Number(v);
            };
            startTransition(async () => {
              await updateMetric(objectiveId, num("current"), num("target"));
              setEditing(false);
              toast.success("Metrica aggiornata");
            });
          }}
        >
          <label className="flex items-center gap-1">
            Attuale
            <Input name="current" inputMode="decimal" defaultValue={metric.current ?? ""} className="h-8 w-20" />
          </label>
          <label className="flex items-center gap-1">
            Target
            <Input name="target" inputMode="decimal" defaultValue={metric.target ?? ""} className="h-8 w-20" />
          </label>
          <Button size="sm" type="submit" disabled={pending}>
            Salva
          </Button>
          <Button size="sm" type="button" variant="ghost" onClick={() => setEditing(false)}>
            Annulla
          </Button>
          <Button
            size="sm"
            type="button"
            variant="ghost"
            className="ml-auto text-danger"
            disabled={pending}
            onClick={() => {
              if (!window.confirm(`Togliere la metrica "${metric.label}" da questo obiettivo?`)) return;
              startTransition(async () => {
                await removeMetric(objectiveId);
                toast.success("Metrica tolta");
              });
            }}
          >
            <Trash2 className="h-3.5 w-3.5" /> Togli metrica
          </Button>
        </form>
      )}

      {!metric.approved && isAdmin && !editing && (
        <Button
          size="sm"
          variant="outline"
          className="mt-2 h-7"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await approveMetric(objectiveId);
              toast.success("Metrica approvata");
            })
          }
        >
          <Check className="h-3.5 w-3.5" /> Approva metrica
        </Button>
      )}
    </div>
  );
}
