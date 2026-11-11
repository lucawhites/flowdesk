"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { saveAgentInstructions } from "@/app/(app)/work-actions";
import { AGENT_INSTRUCTIONS_MAX } from "@/lib/types";

/** Testo libero con cui l'amministratore istruisce l'agente; gli altri lo vedono in sola lettura. */
export function AgentInstructions({ initial, canEdit }: { initial: string; canEdit: boolean }) {
  const [state, formAction, pending] = useActionState(saveAgentInstructions, undefined);
  const [text, setText] = useState(initial);
  const [savedText, setSavedText] = useState(initial);
  const [seenState, setSeenState] = useState(state);

  // Dopo un salvataggio riuscito il testo corrente diventa quello di riferimento.
  if (state !== seenState) {
    setSeenState(state);
    if (state?.ok) setSavedText(text.trim());
  }

  if (!canEdit) {
    return (
      <div>
        <p className="mb-1 text-xs font-medium text-muted-foreground">Istruzioni per l&apos;agente</p>
        <p className="whitespace-pre-wrap text-sm text-foreground">
          {initial || <span className="text-muted-foreground">Nessuna istruzione: l&apos;agente segue solo le regole di base.</span>}
        </p>
      </div>
    );
  }

  const changed = text.trim() !== savedText;
  const tooLong = text.trim().length > AGENT_INSTRUCTIONS_MAX;

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <label htmlFor="agent-instructions" className="text-xs font-medium text-muted-foreground">
        Istruzioni per l&apos;agente
      </label>
      <Textarea
        id="agent-instructions"
        name="instructions"
        rows={5}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={"Il venerdì solo daily leggere\nQuesta settimana priorità al trunk show\nA Francesca niente telefonate a freddo"}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm" disabled={pending || !changed || tooLong}>
          {pending ? "Salvo…" : "Salva istruzioni"}
        </Button>
        <span className={`text-xs ${tooLong ? "text-danger" : "text-muted-foreground"}`}>
          {text.trim().length}/{AGENT_INSTRUCTIONS_MAX}
        </span>
        {state?.message && <span className="text-xs text-danger">{state.message}</span>}
        {state?.ok && !changed && <span className="text-xs text-success">Salvate. Valgono dalla prossima pianificazione.</span>}
      </div>
      <p className="text-xs text-muted-foreground">
        L&apos;agente le legge ogni mattina insieme alle regole di base. Una per riga, in parole semplici.
      </p>
    </form>
  );
}
