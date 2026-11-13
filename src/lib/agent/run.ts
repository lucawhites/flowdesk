import "server-only";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { addDaysISO, isoToDateColumn } from "@/lib/dates";
import { askClaude, AGENT_MODEL } from "@/lib/agent/claude";
import { DAILY_TEXT_RULES } from "@/lib/agent/daily-text";
import { DAILY_DESCRIPTION_MAX, DAILY_INSTRUCTIONS_MAX } from "@/lib/types";
import { notifyIfObjectiveReached, promoteAndNotify } from "@/lib/notifications";
import {
  MAX_POSTPONED_PER_PERSON,
  POSTPONE_HORIZON_DAYS,
  reservedAreaOf,
  loadAgentContext,
  slotsFor,
  limitSlots,
} from "@/lib/agent/context";

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
      // Sigla della nuova daily ("n1", "n2", …) per citarla in "order".
      key: z.string(),
      assigneeId: z.string(),
      objectiveId: z.string(),
      // Vuoto ("") solo per le routine senza passi.
      stepId: z.string(),
      title: z.string(),
      description: z.string(),
      instructions: z.string(),
    }),
  ),
  // Daily già esistenti da spostare a un altro giorno.
  postpone: z.array(z.object({ dailyId: z.string(), toDate: z.string(), reason: z.string() })),
  // Ordine di priorità delle daily di oggi, per persona: id esistenti e sigle delle nuove.
  order: z.array(z.object({ assigneeId: z.string(), items: z.array(z.string()) })),
  note: z.string(),
});

const PLAN_SYSTEM = `${ELITTER}

Sei l'agente pianificatore di Flowdesk. Ogni mattina feriale crei le "daily" del giorno: micro-attività concrete che, sommate, completano i passi degli obiettivi. Poi riorganizzi la giornata di ogni persona: metti le daily in ordine di priorità e, se serve, rimandi le meno urgenti.

Ricevi in JSON: la data, le persone (aree di competenza, arretrati ancora aperti nell'ordine attuale, posti liberi oggi, assenze dal calendario), gli "obiettivi" pianificabili oggi (area, responsabile, "role", scadenza "dueDate", descrizione, metrica, passi in ordine con quello corrente, daily recenti), "scadenzeInCoda" (obiettivi in coda con scadenza vicina che oggi non puoi far avanzare) e "noteProgetti": contesto e regole dell'amministratore per progetto (chiave = area). Rispetta le descrizioni degli obiettivi e le note del loro progetto: contano come istruzioni dell'amministratore.

Il campo "role" dice la priorità di ogni obiettivo:
- "consegna": consegna di Produzione con data fissa. Massima priorità quando la scadenza è vicina; usa i posti riservati alla Produzione.
- "attivo": uno dei (massimo 3) obiettivi su cui la persona sta lavorando adesso. Qui va la maggior parte delle daily.
- "routine": attività ricorrente con una cadenza ("cadence", es. "martedì e venerdì", "ogni giorno lavorativo"). Crea una daily solo nei giorni che la cadenza prevede e se tra arretrati e daily recenti non ce n'è già una aperta per quella routine. Le routine possono non avere passi: in quel caso "stepId" è "".
- "coda": i primi obiettivi in coda della persona, non ancora attivi. Usa per loro SOLO i posti che restano liberi dopo aver coperto consegne, attivi e routine: anche più daily nello stesso giorno se c'è spazio, ma solo attività utili a prepararli (contatti, materiali, informazioni). Se attivi e consegne hanno lavoro da fare, la coda aspetta.

Regole per le nuove daily:
- Dai a ogni nuova daily una "key" diversa: "n1", "n2", …
- Per ogni persona crea al massimo "freeSlots" daily (più una per ogni sua daily che rimandi, vedi sotto); se non ha posti liberi non crearne. I posti sono di due tipi: "freeSlotsGeneral" vale per qualsiasi area, "reservedSlots" (es. {"Produzione": 2, "GFP": 1}) vale solo per obiettivi di quell'area. Le daily di un'area riservata usano prima i suoi posti riservati, poi quelli generali; le altre solo quelli generali. Punta a riempire i posti liberi, ma solo con attività utili.
- Assenze: chi ha "absentToday": true oggi non c'è e non riceve daily (ha 0 posti). Se è il responsabile di un obiettivo con un passo urgente, assegna la daily a un'altra persona con competenza in quell'area, se c'è. Chi ha "partlyAbsentToday": true è via qualche ora (vedi "partialAbsences"): dagli attività brevi. Tieni conto anche delle assenze dei prossimi giorni ("absentDays"): anticipa ciò che deve fare prima di partire.
- Ogni daily è collegata a uno degli "obiettivi" ricevuti e al suo passo corrente (currentStepId). Puoi usare il passo successivo solo se il corrente è già ben coperto da daily aperte.
- Assegna le daily a chi ha competenza nell'area dell'obiettivo; preferisci il responsabile dell'obiettivo. "Commerciale" vale come supporto all'area Sales. Non dare a una persona daily di aree che non sono sue.
- Una daily si fa in mezza giornata al massimo: verbo all'infinito all'inizio, concreta e verificabile (es. "Scrivere a 5 boutique di Dubai con il catalogo bracciali"), massimo 110 caratteri, niente frasi vaghe come "lavorare su" o "approfondire".
- ${DAILY_TEXT_RULES}
- Non ripetere attività già presenti tra gli arretrati o tra le daily recenti non completate; costruisci sul lavoro già fatto (daily completate) per fare il passo successivo logico.
- Distribuisci le daily tra gli obiettivi attivi della stessa persona nel corso della settimana, non tutte sullo stesso.
- Usa solo gli id ricevuti, copiati esattamente.

Regole per riorganizzare (campi "order" e "postpone"):
- "order": per ogni persona che oggi ha almeno due daily aperte, elenca TUTTE le sue daily di oggi dalla più urgente alla meno urgente, usando l'id degli arretrati e la key delle nuove. Criteri, in ordine: scadenze vicine o già superate (dueDate dell'obiettivo, date citate nei titoli o nelle istruzioni dell'amministratore), poi ciò che sblocca il lavoro di altri, poi il resto. Se l'ordine attuale va già bene, ripetilo uguale.
- "postpone": puoi spostare a un giorno lavorativo successivo (entro ${POSTPONE_HORIZON_DAYS} giorni, formato YYYY-MM-DD) solo arretrati con "byAgent": true, al massimo ${MAX_POSTPONED_PER_PERSON} per persona, e solo per fare posto a qualcosa di chiaramente più urgente o perché oggi quell'attività non si può fare. Non rimandare mai a un giorno in cui la persona è assente ("absentDays"). Ogni daily rimandata libera un posto per quella persona. In "reason" spiega il motivo in una frase.
- Le daily create a mano dal team ("byAgent": false) non si rimandano mai. Nessuna daily si cancella o si riscrive. Nel dubbio non rimandare: lascia "postpone" vuoto.
- In "note" scrivi una riga sul criterio usato oggi, citando eventuali daily rimandate. Se in "scadenzeInCoda" c'è un obiettivo che rischia la scadenza, segnalalo qui in una frase (chi, cosa, entro quando).`;

export async function runPlan(teamId: string, today: string, opts: { dryRun?: boolean } = {}) {
  // Prima di pianificare: posti attivi liberi e date di inizio arrivate fanno partire la coda.
  if (!opts.dryRun) await promoteAndNotify(teamId).catch((e) => console.error("Coda degli obiettivi non aggiornata:", e));
  const ctx = await loadAgentContext(teamId, today);
  if (ctx.people.length > 0 && ctx.people.every((p) => p.absentToday)) {
    return logRun(teamId, today, "plan", "skipped", { summary: "Tutto il team è assente oggi secondo il calendario." });
  }
  const openCount = ctx.people.reduce((n, p) => n + p.backlog.length, 0);
  const totalSlots = ctx.people.reduce((n, p) => n + p.freeSlots, 0);
  // Anche senza posti liberi c'è lavoro da fare: riordinare o rimandare le daily aperte.
  if (ctx.objectives.length === 0 || (totalSlots === 0 && openCount === 0)) {
    return logRun(teamId, today, "plan", "skipped", {
      summary: ctx.objectives.length === 0 ? "Nessun obiettivo attivo." : "Niente da pianificare.",
    });
  }

  const input = {
    oggi: today,
    persone: ctx.people.map((p) => ({
      id: p.id,
      name: p.name,
      areas: p.areas,
      backlog: p.backlog,
      freeSlots: p.freeSlots,
      freeSlotsGeneral: p.freeSlotsGeneral,
      reservedSlots: p.reservedSlots,
      absentToday: p.absentToday,
      partlyAbsentToday: p.partlyAbsentToday,
      absentDays: p.absentDays,
      partialAbsences: p.partialAbsences,
    })),
    obiettivi: ctx.objectives.filter((o) => o.currentStepId || o.role === "routine"),
    scadenzeInCoda: ctx.queueDeadlines,
    noteProgetti: ctx.projectNotes,
  };

  try {
    const { data, usage, model } = await askClaude(withInstructions(PLAN_SYSTEM, ctx.instructions), input, PlanSchema);

    // ── Controlli in codice: l'agente propone, qui si decide cosa è ammesso. ──

    // 1. Rimandi: solo daily create dall'agente, verso un giorno lavorativo vicino, poche per persona.
    const backlog = new Map(ctx.people.flatMap((p) => p.backlog.map((d) => [d.id, { ...d, assigneeId: p.id }] as const)));
    const lastDay = addDaysISO(today, POSTPONE_HORIZON_DAYS);
    const postponedBy = new Map<string, number>();
    const absentDaysOf = new Map(ctx.people.map((p) => [p.id, p.absentDays]));
    const postponed = data.postpone.filter((m, i, all) => {
      const daily = backlog.get(m.dailyId);
      if (!daily || !daily.byAgent || all.findIndex((x) => x.dailyId === m.dailyId) !== i) return false;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(m.toDate) || m.toDate <= today || m.toDate > lastDay) return false;
      const weekday = isoToDateColumn(m.toDate).getUTCDay();
      if (Number.isNaN(weekday) || weekday === 0 || weekday === 6) return false;
      if (absentDaysOf.get(daily.assigneeId)?.includes(m.toDate)) return false;
      const count = postponedBy.get(daily.assigneeId) ?? 0;
      if (count >= MAX_POSTPONED_PER_PERSON) return false;
      postponedBy.set(daily.assigneeId, count + 1);
      return true;
    });
    const postponedIds = new Set(postponed.map((m) => m.dailyId));

    // 2. Nuove daily: id validi, passo dell'obiettivo giusto, tetto per persona ricalcolato
    //    dopo i rimandi (posti riservati solo per obiettivi della loro area).
    const remaining = new Map(
      ctx.people.map((p) => {
        const kept = p.backlog.filter((d) => !postponedIds.has(d.id));
        const slots = slotsFor(
          p.areas,
          kept.map((d) => d.area),
        );
        return [p.id, limitSlots(slots, p.absentToday, p.partlyAbsentToday)] as const;
      }),
    );
    const steps = new Map(ctx.objectives.flatMap((o) => o.steps.map((s) => [s.id, o.id] as const)));
    const areaOf = new Map(ctx.objectives.map((o) => [o.id, o.area]));
    const roleOf = new Map(ctx.objectives.map((o) => [o.id, o.role]));
    // Gli obiettivi in coda prendono solo i posti rimasti: si valutano per ultimi.
    const byPriority = [...data.dailies].sort(
      (a, b) => Number(roleOf.get(a.objectiveId) === "coda") - Number(roleOf.get(b.objectiveId) === "coda"),
    );
    const accepted = byPriority.filter((d) => {
      const left = remaining.get(d.assigneeId);
      const role = roleOf.get(d.objectiveId);
      const stepOk = d.stepId === "" ? role === "routine" : steps.get(d.stepId) === d.objectiveId;
      if (!left || left.freeSlots <= 0 || !role || !stepOk || !d.title.trim()) return false;
      const area = reservedAreaOf(areaOf.get(d.objectiveId));
      if (area && (left.reservedSlots[area] ?? 0) > 0) left.reservedSlots[area] -= 1;
      else if (left.freeSlotsGeneral > 0) left.freeSlotsGeneral -= 1;
      else return false;
      left.freeSlots -= 1;
      return true;
    });

    // 3. Ordine: per persona, le daily di oggi (arretrati non rimandati + nuove) nell'ordine
    //    proposto; quelle che l'agente ha dimenticato restano in coda nell'ordine di prima.
    const newByKey = new Map(accepted.map((d) => [d.key, d]));
    const positions = new Map<string, number>(); // id di una daily esistente oppure key di una nuova
    let reordered = 0;
    for (const person of ctx.people) {
      const proposal = data.order.find((o) => o.assigneeId === person.id);
      if (!proposal) continue;
      const mine = [
        ...person.backlog.filter((d) => !postponedIds.has(d.id)).map((d) => d.id),
        ...accepted.filter((d) => d.assigneeId === person.id).map((d) => d.key),
      ];
      if (mine.length < 2) continue;
      const wanted = [...new Set(proposal.items)].filter((item) => mine.includes(item));
      const final = [...wanted, ...mine.filter((item) => !wanted.includes(item))];
      final.forEach((item, i) => positions.set(item, i + 1));
      if (final.some((item, i) => item !== mine[i])) reordered += 1;
    }

    const parts = [`${accepted.length} daily create`];
    if (postponed.length > 0) parts.push(`${postponed.length} rimandat${postponed.length === 1 ? "a" : "e"}`);
    if (reordered > 0) parts.push(`priorità riordinate per ${reordered} ${reordered === 1 ? "persona" : "persone"}`);

    const run = await logRun(teamId, today, "plan", opts.dryRun ? "dry" : "ok", {
      model,
      usage,
      summary: `${parts.join(", ")}${opts.dryRun ? " (prova, non salvato)" : ""}. ${data.note}`,
      output: {
        proposed: data.dailies,
        accepted: accepted.length,
        postponed: postponed.map((m) => ({ ...m, title: backlog.get(m.dailyId)?.title })),
        order: data.order,
        dryRun: !!opts.dryRun,
      },
    });

    if (!opts.dryRun) {
      await prisma.$transaction([
        // Una daily rimandata riparte senza ordine manuale nel nuovo giorno.
        ...postponed.map((m) =>
          prisma.daily.updateMany({
            where: { id: m.dailyId, teamId, completedAt: null },
            data: { date: isoToDateColumn(m.toDate), position: null },
          }),
        ),
        ...[...positions]
          .filter(([item]) => !newByKey.has(item))
          .map(([id, position]) => prisma.daily.updateMany({ where: { id, teamId }, data: { position } })),
        ...accepted.map((d) =>
          prisma.daily.create({
            data: {
              title: d.title.trim().slice(0, 200),
              description: d.description.trim().slice(0, DAILY_DESCRIPTION_MAX) || null,
              instructions: d.instructions.trim().slice(0, DAILY_INSTRUCTIONS_MAX) || null,
              date: isoToDateColumn(today),
              position: positions.get(d.key) ?? null,
              teamId,
              assigneeId: d.assigneeId,
              objectiveId: d.objectiveId,
              stepId: d.stepId || null,
              creatorId: ctx.adminId,
              agentRunId: run.id,
            },
          }),
        ),
      ]);
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

Sei l'agente pianificatore di Flowdesk e fai la revisione del lunedì sugli obiettivi attivi e sulle consegne.

Ricevi in JSON la data, gli obiettivi attivi e le consegne con descrizione, passi (fatti e da fare), metrica e daily delle ultime tre settimane (con data di completamento) e "noteProgetti" (contesto dell'amministratore per progetto, chiave = area).

Compiti:
1. stepsCompleted: indica i passi NON ancora segnati come fatti che le daily completate dimostrano chiaramente conclusi. Sii prudente: un passo è fatto solo se il risultato del passo è raggiunto, non se ci si è solo lavorato. Nel dubbio non segnarlo.
2. stalled: segnala gli obiettivi fermi (nessuna daily completata negli ultimi 7 giorni, oppure stesso passo bloccato da più di due settimane, oppure daily rimandate di continuo). Per ognuno una ragione breve e un suggerimento concreto per sbloccarlo.
3. summary: 2-4 frasi per il team su com'è andata la settimana passata e cosa conta questa settimana.
Usa solo gli id ricevuti.`;

export async function runReview(teamId: string, today: string, opts: { dryRun?: boolean } = {}) {
  const ctx = await loadAgentContext(teamId, today);
  const reviewed = ctx.objectives.filter((o) => o.role === "attivo" || o.role === "consegna");
  if (reviewed.length === 0) return logRun(teamId, today, "review", "skipped", { summary: "Nessun obiettivo attivo." });

  try {
    const input = { oggi: today, obiettivi: reviewed, noteProgetti: ctx.projectNotes };
    const { data, usage, model } = await askClaude(withInstructions(REVIEW_SYSTEM, ctx.instructions), input, ReviewSchema);

    const open = new Set(reviewed.flatMap((o) => o.steps.filter((s) => !s.done).map((s) => s.id)));
    const toComplete = data.stepsCompleted.filter((s) => open.has(s.stepId));
    if (!opts.dryRun && toComplete.length > 0) {
      await prisma.objectiveStep.updateMany({ where: { id: { in: toComplete.map((s) => s.stepId) } }, data: { completedAt: new Date() } });
      // Se un passo segnato dall'agente chiude un obiettivo, il team riceve l'email.
      const doneIds = new Set(toComplete.map((s) => s.stepId));
      for (const o of reviewed.filter((o) => o.steps.some((s) => doneIds.has(s.id)))) {
        await notifyIfObjectiveReached(o.id, null).catch((e) => console.error("Email obiettivo raggiunto non inviata:", e));
      }
      // Un obiettivo chiuso dalla revisione libera un posto: parte il primo della coda.
      await promoteAndNotify(teamId).catch((e) => console.error("Coda degli obiettivi non aggiornata:", e));
    }
    const focusIds = new Set(reviewed.map((o) => o.id));
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

export async function logRun(
  teamId: string,
  today: string,
  kind: "plan" | "review" | "assist",
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
