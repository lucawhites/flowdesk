"use client";

import type { ReactNode } from "react";
import { saveProject } from "@/app/(app)/tasks/actions";
import { FieldError, FormDialog } from "@/components/form-dialog";
import { Input, Label, Textarea } from "@/components/ui/input";
import type { ProjectItem } from "@/lib/types";

export function ProjectDialog({ project, trigger }: { project?: ProjectItem; trigger: ReactNode }) {
  const isEdit = !!project;

  return (
    <FormDialog
      title={isEdit ? "Modifica progetto" : "Nuovo progetto"}
      description={isEdit ? undefined : "Un'area di lavoro che raccoglie obiettivi, es. Produzione o Social media."}
      trigger={trigger}
      action={saveProject.bind(null, project?.id ?? null)}
      submitLabel={isEdit ? "Salva" : "Crea progetto"}
      successMessage={isEdit ? "Progetto aggiornato" : "Progetto creato"}
    >
      {(state) => (
        <>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="project-name">Nome</Label>
            <Input id="project-name" name="name" placeholder="Es. Commerciale" defaultValue={project?.name} required autoFocus />
            <FieldError messages={state?.errors?.name} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="project-description">Descrizione (opzionale)</Label>
            <Textarea id="project-description" name="description" defaultValue={project?.description ?? ""} />
          </div>
        </>
      )}
    </FormDialog>
  );
}
