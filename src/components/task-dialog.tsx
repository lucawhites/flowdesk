"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { createTask, updateTask, type TaskFormState } from "@/app/(app)/tasks/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PERIOD_LABELS, PERIOD_TABS, PRIORITY_OPTIONS } from "@/lib/task-helpers";
import type { TaskWithRelations, TeamMember } from "@/lib/types";

function toDateInputValue(date: Date | null) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

export function TaskDialog({
  members,
  currentUserId,
  task,
  defaultPeriod,
  trigger,
}: {
  members: TeamMember[];
  currentUserId: string;
  task?: TaskWithRelations;
  defaultPeriod?: "DAILY" | "WEEKLY" | "MONTHLY";
  trigger?: React.ReactNode;
}) {
  const isEdit = !!task;
  const [open, setOpen] = useState(false);

  const action = isEdit
    ? updateTask.bind(null, task.id)
    : createTask;

  const [state, formAction, pending] = useActionState<TaskFormState, FormData>(action, undefined);
  const attempted = useRef(false);

  useEffect(() => {
    if (pending) attempted.current = true;
    if (!pending && attempted.current && !state?.errors && !state?.message) {
      attempted.current = false;
      setOpen(false);
      toast.success(isEdit ? "Task aggiornata" : "Task creata");
    }
  }, [pending, state, isEdit]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Nuova task
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifica task" : "Nuova task"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Aggiorna i dettagli della task." : "Crea una task giornaliera, settimanale o mensile per te o un collega."}
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">Titolo</Label>
            <Input id="title" name="title" placeholder="Es. Inviare report settimanale" defaultValue={task?.title} required autoFocus />
            {state?.errors?.title && <p className="text-xs text-danger">{state.errors.title[0]}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Descrizione (opzionale)</Label>
            <Textarea id="description" name="description" placeholder="Dettagli, link, note..." defaultValue={task?.description ?? ""} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="period">Periodicità</Label>
              <Select name="period" defaultValue={task?.period ?? defaultPeriod ?? "DAILY"}>
                <SelectTrigger id="period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_TABS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {PERIOD_LABELS[p.value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="priority">Priorità</Label>
              <Select name="priority" defaultValue={task?.priority ?? "MEDIUM"}>
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dueDate">Scadenza (opzionale)</Label>
              <Input id="dueDate" name="dueDate" type="date" defaultValue={toDateInputValue(task?.dueDate ?? null)} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="assigneeId">Responsabile</Label>
            <Select name="assigneeId" defaultValue={task?.assignee.id ?? currentUserId}>
              <SelectTrigger id="assigneeId">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.id === currentUserId ? `${member.name} (tu)` : member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state?.errors?.assigneeId && <p className="text-xs text-danger">{state.errors.assigneeId[0]}</p>}
          </div>

          {state?.message && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{state.message}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Salva modifiche" : "Crea task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
