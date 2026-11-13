"use client";

import { useEffect, useState, type ReactNode } from "react";
import { getObjectiveLinkOptions, saveObjective } from "@/app/(app)/work-actions";
import { FieldError, FormDialog } from "@/components/form-dialog";
import { MemberSelect } from "@/components/member-select";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CADENCE_MAX, KIND_HINT, KIND_LABEL, STATUS_LABEL, type ObjectiveKind, type ObjectiveStatus } from "@/lib/objective-status";
import type { ObjectiveItem, ObjectiveLinkOption, TeamMember } from "@/lib/types";

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

          <PlanningFields objective={objective} />

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

const NONE = "NONE";

/** Tipo, stato, data di inizio, cadenza, "Parte dopo" e ombrello. */
function PlanningFields({ objective }: { objective?: ObjectiveItem }) {
  const [kind, setKind] = useState<ObjectiveKind>(objective?.kind ?? "STANDARD");
  const [options, setOptions] = useState<ObjectiveLinkOption[] | null>(null);

  // La finestra monta questi campi solo quando si apre: gli obiettivi da collegare si leggono allora.
  useEffect(() => {
    let alive = true;
    getObjectiveLinkOptions().then((o) => alive && setOptions(o));
    return () => {
      alive = false;
    };
  }, []);

  const others = (options ?? []).filter((o) => o.id !== objective?.id);
  const afterOptions = others.filter((o) => o.kind !== "UMBRELLA");
  const umbrellaOptions = others.filter((o) => o.kind === "UMBRELLA");
  const statuses: ObjectiveStatus[] = kind === "STANDARD" ? ["ACTIVE", "QUEUED", "PAUSED"] : ["ACTIVE", "PAUSED"];
  const defaultStatus = objective?.status ?? (kind === "STANDARD" ? "QUEUED" : "ACTIVE");

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="objective-kind">Tipo</Label>
          <Select name="kind" value={kind} onValueChange={(v) => setKind(v as ObjectiveKind)}>
            <SelectTrigger id="objective-kind">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(KIND_LABEL) as ObjectiveKind[]).map((k) => (
                <SelectItem key={k} value={k}>
                  {KIND_LABEL[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {kind !== "UMBRELLA" && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="objective-status">Stato</Label>
            <Select key={kind} name="status" defaultValue={statuses.includes(defaultStatus) ? defaultStatus : "ACTIVE"}>
              <SelectTrigger id="objective-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((st) => (
                  <SelectItem key={st} value={st}>
                    {STATUS_LABEL[st]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      <p className="-mt-2 text-xs text-muted-foreground">{KIND_HINT[kind]}</p>

      {kind === "ROUTINE" && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="objective-cadence">Cadenza</Label>
          <Input
            id="objective-cadence"
            name="cadence"
            maxLength={CADENCE_MAX}
            placeholder="Es. martedì e venerdì · ogni giorno lavorativo · ogni mese dal 20"
            defaultValue={objective?.cadence ?? ""}
          />
        </div>
      )}

      {kind !== "UMBRELLA" && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="objective-start">Inizio (opzionale)</Label>
          <Input id="objective-start" name="startDate" type="date" defaultValue={objective?.startDate ?? ""} />
          <p className="text-xs text-muted-foreground">Prima di questa data non diventa attivo e l&apos;agente non lo pianifica.</p>
        </div>
      )}

      {kind === "STANDARD" && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="objective-after">Parte dopo (opzionale)</Label>
          {options === null ? (
            <>
              <p className="text-xs text-muted-foreground">Carico gli obiettivi…</p>
              <input type="hidden" name="afterId" value={objective?.after?.id ?? NONE} />
            </>
          ) : (
            <Select name="afterId" defaultValue={objective?.after?.id ?? NONE}>
              <SelectTrigger id="objective-after">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Nessuno: segue solo l&apos;ordine della coda</SelectItem>
                {afterOptions.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.title} · {o.assigneeName.split(" ")[0]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <p className="text-xs text-muted-foreground">Resta in attesa finché quell&apos;obiettivo non è al 100%, poi parte da solo.</p>
        </div>
      )}

      {/* Finché la lista non è pronta (o non ci sono ombrelli) il collegamento attuale resta com'è. */}
      {kind !== "UMBRELLA" && umbrellaOptions.length === 0 && (
        <input type="hidden" name="umbrellaId" value={objective?.umbrella?.id ?? NONE} />
      )}
      {kind !== "UMBRELLA" && umbrellaOptions.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="objective-umbrella">Conta per l&apos;ombrello (opzionale)</Label>
          <Select name="umbrellaId" defaultValue={objective?.umbrella?.id ?? NONE}>
            <SelectTrigger id="objective-umbrella">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Nessuno</SelectItem>
              {umbrellaOptions.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </>
  );
}
