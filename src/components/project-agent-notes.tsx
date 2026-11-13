"use client";

import { useActionState, useState } from "react";
import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { saveProjectAgentNotes } from "@/app/(app)/work-actions";
import { PROJECT_AGENT_NOTES_MAX } from "@/lib/types";

/** Contesto e regole per l'agente su un progetto. Lo monta solo la pagina del progetto, e solo per l'amministratore. */
export function ProjectAgentNotes({ projectId, initial }: { projectId: string; initial: string }) {
  const [state, formAction, pending] = useActionState(saveProjectAgentNotes, undefined);
  const [text, setText] = useState(initial);
  const [savedText, setSavedText] = useState(initial);
  const [seenState, setSeenState] = useState(state);

  // Dopo un salvataggio riuscito il testo corrente diventa quello di riferimento.
  if (state !== seenState) {
    setSeenState(state);
    if (state?.ok) setSavedText(text.trim());
  }

  const changed = text.trim() !== savedText;
  const tooLong = text.trim().length > PROJECT_AGENT_NOTES_MAX;

  return (
    <form
      action={formAction}
      className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6"
    >
      <input type="hidden" name="projectId" value={projectId} />
      <label htmlFor="project-agent-notes" className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
        <Bot className="h-4 w-4 text-accent" /> Note per l&apos;agente
      </label>
      <p className="text-xs text-muted-foreground">
        Contesto e regole che l&apos;agente usa quando pianifica gli obiettivi attivi e in coda di questo progetto: fornitori,
        priorità, cosa non fare. Le vedi solo tu.
      </p>
      <Textarea
        id="project-agent-notes"
        name="notes"
        rows={6}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={"Priorità alle scadenze più vicine\nLe giacche le fa Moreno\nMai daily che inviano senza ok"}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm" disabled={pending || !changed || tooLong}>
          {pending ? "Salvo…" : "Salva note"}
        </Button>
        <span className={`text-xs ${tooLong ? "text-danger" : "text-muted-foreground"}`}>
          {text.trim().length}/{PROJECT_AGENT_NOTES_MAX}
        </span>
        {state?.message && <span className="text-xs text-danger">{state.message}</span>}
        {state?.ok && !changed && <span className="text-xs text-success">Salvate. Valgono dalla prossima pianificazione.</span>}
      </div>
    </form>
  );
}
