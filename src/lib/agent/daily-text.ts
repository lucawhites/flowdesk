import "server-only";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isoToDateColumn, todayISO } from "@/lib/dates";
import { askClaude } from "@/lib/agent/claude";
import { DAILY_DESCRIPTION_MAX, DAILY_INSTRUCTIONS_MAX } from "@/lib/types";

/** Regole comuni per descrizione e istruzioni: valgono per la pianificazione e per il pulsante. */
export const DAILY_TEXT_RULES = `Per ogni daily scrivi anche:
  · "description": una riga (massimo 160 caratteri) che dice a cosa serve la daily; si vede nell'anteprima della card, quindi non ripetere il titolo.
  · "instructions": come svolgerla, per chi la prende in mano senza conoscere il contesto. Da 3 a 7 punti numerati brevi ("1. …"), uno per riga, nell'ordine in cui si fanno: cosa preparare, cosa fare, a chi scrivere o dove trovare il materiale quando il contesto lo dice. Chiudi con una riga "Fatta quando: …" con il risultato verificabile. Usa solo informazioni presenti nei dati ricevuti: non inventare nomi, contatti, file, date o numeri. Non scrivere mai prezzi, margini, sconti o dati bancari: le istruzioni le legge tutto il team.`;

const ELITTER =
  "Elitter è un piccolo brand italiano di pelletteria esotica di lusso (coccodrillo, alligatore), capi e accessori fatti a mano in Italia, " +
  "con vendita diretta, bespoke, collaborazioni e social. Il team è di tre persone. Scrivi sempre in italiano.";

const SYSTEM = `${ELITTER}

Sei l'assistente di Flowdesk. Ricevi in JSON una "daily" (micro-attività di mezza giornata al massimo) con il suo responsabile, le eventuali note, l'obiettivo e il passo a cui è collegata, le daily recenti dello stesso obiettivo e il contesto del progetto scritto dall'amministratore. Scrivi la descrizione breve e le istruzioni della daily.

${DAILY_TEXT_RULES}

Se la daily è libera (senza obiettivo), basati solo sul titolo e sulle note: istruzioni più generiche ma comunque concrete.`;

const TextSchema = z.object({ description: z.string(), instructions: z.string() });

export type DailyTextInput = {
  title: string;
  notes: string | null;
  assigneeId: string;
  objectiveId: string | null;
  stepId: string | null;
};

/**
 * Propone descrizione e istruzioni per una daily (pulsante "Proponi istruzioni").
 * Registra la chiamata in AgentRun (tipo "assist") così il costo entra in quello del mese.
 */
export async function proposeDailyText(teamId: string, input: DailyTextInput) {
  const [assignee, objective] = await Promise.all([
    prisma.user.findFirst({ where: { id: input.assigneeId, teamId }, select: { name: true } }),
    input.objectiveId
      ? prisma.objective.findFirst({
          where: { id: input.objectiveId, teamId },
          select: {
            title: true,
            description: true,
            dueDate: true,
            project: { select: { name: true, agentNotes: true } },
            assignee: { select: { name: true } },
            steps: { select: { id: true, title: true, completedAt: true }, orderBy: { position: "asc" } },
            dailies: {
              select: { title: true, completedAt: true, assignee: { select: { name: true } } },
              orderBy: { date: "desc" },
              take: 12,
            },
          },
        })
      : null,
  ]);

  const payload = {
    daily: { titolo: input.title, note: input.notes, responsabile: assignee?.name ?? null },
    obiettivo: objective && {
      titolo: objective.title,
      progetto: objective.project.name,
      responsabile: objective.assignee.name,
      scadenza: objective.dueDate?.toISOString().slice(0, 10) ?? null,
      descrizione: objective.description?.slice(0, 1000) ?? null,
      passi: objective.steps.map((s, i) => ({
        n: i + 1,
        titolo: s.title,
        fatto: !!s.completedAt,
        questaDaily: s.id === input.stepId,
      })),
      dailyRecenti: objective.dailies.map((d) => ({ titolo: d.title, fatta: !!d.completedAt, di: d.assignee.name })),
    },
    contestoProgetto: objective?.project.agentNotes?.trim() || null,
  };

  const { data, usage, model } = await askClaude(SYSTEM, payload, TextSchema, { effort: "low", maxTokens: 3000 });

  await prisma.agentRun.create({
    data: {
      teamId,
      kind: "assist",
      status: "ok",
      day: isoToDateColumn(todayISO()),
      model,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      costUsd: usage.costUsd,
      summary: `Istruzioni proposte per «${input.title.slice(0, 120)}»`,
      finishedAt: new Date(),
    },
  });

  return {
    description: data.description.trim().slice(0, DAILY_DESCRIPTION_MAX),
    instructions: data.instructions.trim().slice(0, DAILY_INSTRUCTIONS_MAX),
  };
}
