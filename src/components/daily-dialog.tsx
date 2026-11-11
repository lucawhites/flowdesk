"use client";

import type { ReactNode } from "react";
import { saveDaily } from "@/app/(app)/tasks/actions";
import { FieldError, FormDialog } from "@/components/form-dialog";
import { MemberSelect } from "@/components/member-select";
import { Input, Label } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DailyItem, ObjectiveOption, TeamMember } from "@/lib/types";

export function DailyDialog({
  members,
  objectives,
  currentUserId,
  today,
  daily,
  defaultObjectiveId,
  defaultAssigneeId,
  trigger,
}: {
  members: TeamMember[];
  objectives: ObjectiveOption[];
  currentUserId: string;
  today: string;
  daily?: DailyItem;
  defaultObjectiveId?: string;
  defaultAssigneeId?: string;
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="daily-date">Giorno</Label>
              <Input id="daily-date" name="date" type="date" defaultValue={daily?.date ?? today} required />
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

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="daily-objective">Obiettivo</Label>
            <Select name="objectiveId" defaultValue={daily?.objective?.id ?? defaultObjectiveId ?? "NONE"}>
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
        </>
      )}
    </FormDialog>
  );
}
