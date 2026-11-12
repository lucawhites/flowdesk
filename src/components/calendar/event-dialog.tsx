"use client";

import type { ReactNode } from "react";
import { saveEvent } from "@/app/(app)/calendario/actions";
import { FieldError, FormDialog } from "@/components/form-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input, Label } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CalendarEventItem, TeamMember } from "@/lib/types";

export function EventDialog({
  members,
  currentUserId,
  event,
  defaultDate,
  trigger,
}: {
  members: TeamMember[];
  currentUserId: string;
  event?: CalendarEventItem;
  defaultDate: string;
  trigger: ReactNode;
}) {
  const isEdit = !!event;

  return (
    <FormDialog
      title={isEdit ? "Modifica evento" : "Nuovo evento"}
      description={isEdit ? undefined : "Un'assenza, un appuntamento o qualsiasi cosa il team debba sapere."}
      trigger={trigger}
      action={saveEvent.bind(null, event?.id ?? null)}
      submitLabel={isEdit ? "Salva" : "Crea evento"}
      successMessage={isEdit ? "Evento aggiornato" : "Evento creato"}
    >
      {(state) => (
        <>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="event-title">Cosa succede</Label>
            <Input id="event-title" name="title" placeholder="Es. Appuntamento dal fornitore" defaultValue={event?.title} required autoFocus />
            <FieldError messages={state?.errors?.title} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="event-person">Chi riguarda</Label>
            <Select name="personId" defaultValue={event ? (event.person?.id ?? "TEAM") : currentUserId}>
              <SelectTrigger id="event-person">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TEAM">Tutto il team</SelectItem>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.id === currentUserId ? `${member.name} (tu)` : member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="event-start">Giorno</Label>
              <Input id="event-start" name="startDate" type="date" defaultValue={event?.startDate ?? defaultDate} required />
              <FieldError messages={state?.errors?.startDate} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="event-end">Fino al (opzionale)</Label>
              <Input
                id="event-end"
                name="endDate"
                type="date"
                defaultValue={event && event.endDate !== event.startDate ? event.endDate : ""}
              />
              <FieldError messages={state?.errors?.endDate} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="event-from">Dalle (opzionale)</Label>
              <Input id="event-from" name="startTime" type="time" defaultValue={event?.startTime ?? ""} />
              <FieldError messages={state?.errors?.startTime} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="event-to">Alle (opzionale)</Label>
              <Input id="event-to" name="endTime" type="time" defaultValue={event?.endTime ?? ""} />
              <FieldError messages={state?.errors?.endTime} />
            </div>
          </div>
          <p className="-mt-2 text-xs text-muted-foreground">Senza orario l&apos;evento vale per tutto il giorno.</p>

          <div className="flex items-start gap-3 rounded-lg bg-surface-muted px-3 py-2.5">
            <Checkbox id="event-absence" name="absence" defaultChecked={event?.absence ?? false} className="mt-0.5" />
            <Label htmlFor="event-absence" className="cursor-pointer font-normal">
              <span className="font-medium">Assente</span>
              <span className="block text-xs text-muted-foreground">La persona non è disponibile in questi giorni.</span>
            </Label>
          </div>
        </>
      )}
    </FormDialog>
  );
}
