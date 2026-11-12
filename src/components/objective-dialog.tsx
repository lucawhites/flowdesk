"use client";

import type { ReactNode } from "react";
import { saveObjective } from "@/app/(app)/work-actions";
import { FieldError, FormDialog } from "@/components/form-dialog";
import { MemberSelect } from "@/components/member-select";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ObjectiveItem, TeamMember } from "@/lib/types";

export function ObjectiveDialog({
  members,
  projects,
  currentUserId,
  objective,
  defaultProjectId,
  trigger,
}: {
  members: TeamMember[];
  projects: { id: string; name: string }[];
  currentUserId: string;
  objective?: ObjectiveItem;
  defaultProjectId?: string;
  trigger: ReactNode;
}) {
  const isEdit = !!objective;

  return (
    <FormDialog
      title={isEdit ? "Modifica obiettivo" : "Nuovo obiettivo"}
      description={
        isEdit
          ? undefined
          : "L'avanzamento si calcola da solo: passi fatti su passi totali (senza passi, daily completate su daily collegate)."
      }
      trigger={trigger}
      action={saveObjective.bind(null, objective?.id ?? null)}
      submitLabel={isEdit ? "Salva" : "Crea obiettivo"}
      successMessage={isEdit ? "Obiettivo aggiornato" : "Obiettivo creato"}
    >
      {(state) => (
        <>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="objective-title">Obiettivo</Label>
            <Input
              id="objective-title"
              name="title"
              placeholder="Es. Lanciare la nuova collezione sui social"
              defaultValue={objective?.title}
              required
              autoFocus
            />
            <FieldError messages={state?.errors?.title} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="objective-description">Descrizione (opzionale)</Label>
            <Textarea id="objective-description" name="description" defaultValue={objective?.description ?? ""} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="objective-project">Progetto</Label>
            <Select name="projectId" defaultValue={objective?.project.id ?? defaultProjectId ?? projects[0]?.id}>
              <SelectTrigger id="objective-project">
                <SelectValue placeholder="Scegli un progetto" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError messages={state?.errors?.projectId} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="objective-assignee">Responsabile</Label>
              <MemberSelect
                id="objective-assignee"
                name="assigneeId"
                members={members}
                currentUserId={currentUserId}
                defaultValue={objective?.assignee.id ?? currentUserId}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="objective-due">Scadenza (opzionale)</Label>
              <Input id="objective-due" name="dueDate" type="date" defaultValue={objective?.dueDate ?? ""} />
            </div>
          </div>

          {!isEdit && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="objective-steps">Passi (opzionale)</Label>
              <Textarea
                id="objective-steps"
                name="steps"
                rows={5}
                placeholder={"Un passo per riga, nell'ordine in cui vanno fatti.\nEs. Chiedere il preventivo al fornitore\nApprovare il campione"}
              />
              <p className="text-xs text-muted-foreground">
                Potrai aggiungerne, correggerli o riordinarli anche dopo, dalla pagina dell&apos;obiettivo.
              </p>
            </div>
          )}
        </>
      )}
    </FormDialog>
  );
}
