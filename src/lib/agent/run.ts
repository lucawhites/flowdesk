import "server-only";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isoToDateColumn } from "@/lib/dates";
import { askClaude, AGENT_MODEL } from "@/lib/agent/claude";
import { loadAgentContext } from "@/lib/agent/context";

const ELITTER =
  "Elitter è un piccolo brand italiano di pelletteria esotica di lusso (coccodrillo, alligatore), capi e accessori fatti a mano in Italia, " +
  "con vendita diretta, bespoke, collaborazioni e social. Il team è di tre persone. Scrivi sempre in italiano.";

/** Aggiunge alle regole fisse le istruzioni scritte dall'amministratore nella pagina KPI. */
function withInstructions(system: string, instructions: string | null) {
  if (!instructions) return system;
  return `${system}

Istruzioni dell'amministratore del team (seguile: hanno la precedenza sulle preferenze qui sopra, ma non cambiano il formato della risposta, gli id da usare né il numero massimo di daily per persona):
"""
${instructions}
"""`;
}

// ─── Pianificazione giornaliera ──────────────────────────────────────────────

const PlanSchema = z.object({
  dailies: z.array(
    z.object({
      assigneeId: z.string(),
      objectiveId: z.string(),
      stepId: z.string(),
      title: z.string(),
    }),
  ),
  note: z.string(),
});

const PLAN_SYSTEM = `${ELITTER}

Sei l'agente pianificatore di Flowdesk. Ogni mattina feriale crei le "daily" del giorno: micro-attività concrete che, sommate, completano i passi degli obiettivi del focus del mese.

Ricevi in JSON: la data, le persone (aree di competenza, arretrati ancora aperti, posti liberi oggi) e gli obiettivi in focus (area, responsabile, metrica, passi in ordine con quello corrente, daily recenti).

Regole:
- Per ogni persona crea al massimo "freeSlots" daily; se ha 0 posti liberi non crearne. Punta a riempire i posti liberi, ma solo con attività utili.
- Ogni daily è collegata a un obiettivo in focus e al suo passo corrente (currentStepId). Puoi usare il passo successivo solo se il corrente è già ben coperto da daily aperte.
- Assegna le daily a chi ha competenza nell'area dell'obiettivo; preferisci il responsabile dell'obiettivo. "Commerciale" vale come supporto all'area Sales. Non dare a una persona daily di aree che non sono sue.
- Una daily si fa in mezza giornata al massimo: verbo all'infinito all'inizio, concreta e verificabile (es. "Scrivere a 5 boutique di Dubai con il catalogo bracciali"), massimo 110 caratteri, niente frasi vaghe come "lavorare su" o "approfondire".
- Non ripetere attività già presenti tra gli arretrati o tra le daily recenti non completate; costruisci sul lavoro già fatto (daily completate) per fare il passo successivo logico.
- Distribuisci le daily tra più obiettivi della stessa persona nel corso della settimana, non tutte sullo stesso.
- Usa solo gli id ricevuti, copiati esattamente.
- In "note" scrivi una riga sul criterio usato oggi.`;

export async function runPlan(teamId: string, today: string, opts: { dryRun?: boolean } = {}) {
  const ctx = await loadAgentContext(teamId, today);
  const totalSlots = ctx.people.reduce((n, p) => n + p.freeSlots, 0);
  if (ctx.focus.length === 0 || totalSlots === 0) {
    return logRun(teamId, today, "plan", "skipped", {
      summary: ctx.focus.length === 0 ? "Nessun obiettivo nel focus del mese." : "Nessun posto libero: tutti hanno già 4 daily aperte.",
    });
  }

  const input = {
    oggi: today,
    persone: ctx.people,
    obiettiviInFocus: ctx.focus.filter((o) => o.currentStepId),
  };

  try {
    const { data, usage, model } = await askClaude(withInstructions(PLAN_SYSTEM, ctx.instructions), input, PlanSchema);

    // Controlli in codice: id validi, passo dell'obiettivo giusto, tetto per persona.
    const slots = new Map(ctx.people.map((p) => [p.id, p.freeSlots]));
    const steps = new Map(ctx.focus.flatMap((o) => o.steps.map((s) => [s.id, o.id] as const)));
    const accepted = data.dailies.filter((d) => {
      const left = slots.get(d.assigneeId) ?? 0;
      if (left <= 0 || steps.get(d.stepId) !== d.objectiveId || !d.title.trim()) return false;
      slots.set(d.assigneeId, left - 1);
      return true;
    });

    const run = await logRun(teamId, today, "plan", opts.dryRun ? "dry" : "ok", {
      model,
      usage,
      summary: `${accepted.length} daily create${opts.dryRun ? " (prova, non salvate)" : ""}. ${data.note}`,
      output: { proposed: data.dailies, accepted: accepted.length, dryRun: !!opts.dryRun },
    });

    if (!opts.dryRun && accepted.length > 0) {
      await prisma.daily.createMany({
        data: accepted.map((d) => ({
          title: d.title.trim().slice(0, 200),
          date: isoToDateColumn(today),
          teamId,
          assigneeId: d.assigneeId,
          objectiveId: d.objectiveId,
          stepId: d.stepId,
          creatorId: ctx.adminId,
          agentRunId: run.id,
        })),
      });
    }
    return run;
  } catch (error) {
    return logRun(teamId, today, "plan", "error", { error: String(error) });
  }
}

// ─── Revisione del lunedì ────────────────────────────────────────────────────

const ReviewSchema = z.object({
  stepsCompleted: z.array(z.object({ stepId: z.string(), reason: z.string() })),
  stalled: z.array(z.object({ objectiveId: z.string(), title: z.string(), reason: z.string(), suggestion: z.string() })),
  summary: z.string(),
});

const REVIEW_SYSTEM = `${ELITTER}

Sei l'agente pianificatore di Flowdesk e fai la revisione del lunedì sugli obiettivi del focus del mese.

Ricevi in JSON la data e gli obiettivi in focus con passi (fatti e da fare), metrica e daily delle ultime tre settimane (con data di completamento).

Compiti:
1. stepsCompleted: indica i passi NON ancora segnati come fatti che le daily completate dimostrano chiaramente conclusi. Sii prudente: un passo è fatto solo se il risultato del passo è raggiunto, non se ci si è solo lavorato. Nel dubbio non segnarlo.
2. stalled: segnala gli obiettivi fermi (nessuna daily completata negli ultimi 7 giorni, oppure stesso passo bloccato da più di due settimane, oppure daily rimandate di continuo). Per ognuno una ragione breve e un suggerimento concreto per sbloccarlo.
3. summary: 2-4 frasi per il team su com'è andata la settimana passata e cosa conta questa settimana.
Usa solo gli id ricevuti.`;

export async function runReview(teamId: string, today: string, opts: { dryRun?: boolean } = {}) {
  const ctx = await loadAgentContext(teamId, today);
  if (ctx.focus.length === 0) return logRun(teamId, today, "review", "skipped", { summary: "Nessun obiettivo nel focus del mese." });

  try {
    const input = { oggi: today, obiettiviInFocus: ctx.focus };
    const { data, usage, model } = await askClaude(withInstructions(REVIEW_SYSTEM, ctx.instructions), input, ReviewSchema);

    const open = new Set(ctx.focus.flatMap((o) => o.steps.filter((s) => !s.done).map((s) => s.id)));
    const toComplete = data.stepsCompleted.filter((s) => open.has(s.stepId));
    if (!opts.dryRun && toComplete.length > 0) {
      await prisma.objectiveStep.updateMany({ where: { id: { in: toComplete.map((s) => s.stepId) } }, data: { completedAt: new Date() } });
    }
    const focusIds = new Set(ctx.focus.map((o) => o.id));
    return logRun(teamId, today, "review", opts.dryRun ? "dry" : "ok", {
      model,
      usage,
      summary: data.summary,
      output: { stepsCompleted: toComplete, stalled: data.stalled.filter((s) => focusIds.has(s.objectiveId)), dryRun: !!opts.dryRun },
    });
  } catch (error) {
    return logRun(teamId, today, "review", "error", { error: String(error) });
  }
}

// ─── Registro ────────────────────────────────────────────────────────────────

async function logRun(
  teamId: string,
  today: string,
  kind: "plan" | "review",
  status: "ok" | "dry" | "error" | "skipped",
  extra: {
    model?: string;
    usage?: { inputTokens: number; outputTokens: number; costUsd: number };
    summary?: string;
    error?: string;
    output?: object;
  },
) {
  return prisma.agentRun.create({
    data: {
      teamId,
      kind,
      status,
      day: isoToDateColumn(today),
      model: extra.model ?? (extra.usage ? AGENT_MODEL : null),
      inputTokens: extra.usage?.inputTokens ?? 0,
      outputTokens: extra.usage?.outputTokens ?? 0,
      costUsd: extra.usage?.costUsd ?? 0,
      summary: extra.summary ?? null,
      error: extra.error ?? null,
      output: extra.output ?? undefined,
      finishedAt: new Date(),
    },
  });
}
