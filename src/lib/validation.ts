import * as z from "zod";

export const RegisterSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { error: "Inserisci il tuo nome completo." })
    .max(80),
  company: z
    .string()
    .trim()
    .min(2, { error: "Inserisci il nome della tua azienda." })
    .max(80),
  email: z.email({ error: "Inserisci un indirizzo email valido." }).trim(),
  password: z
    .string()
    .min(8, { error: "La password deve avere almeno 8 caratteri." })
    .regex(/[a-zA-Z]/, { error: "Deve contenere almeno una lettera." })
    .regex(/[0-9]/, { error: "Deve contenere almeno un numero." }),
});

export const LoginSchema = z.object({
  email: z.email({ error: "Inserisci un indirizzo email valido." }).trim(),
  password: z.string().min(1, { error: "Inserisci la password." }),
});

const isoDate = /^\d{4}-\d{2}-\d{2}$/;

export const ProjectSchema = z.object({
  name: z.string().trim().min(2, { error: "Il nome deve avere almeno 2 caratteri." }).max(80),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const ObjectiveSchema = z.object({
  title: z.string().trim().min(2, { error: "Il titolo deve avere almeno 2 caratteri." }).max(140),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  projectId: z.string().min(1, { error: "Scegli un progetto." }),
  assigneeId: z.string().min(1, { error: "Seleziona un responsabile." }),
  dueDate: z.string().regex(isoDate).optional().or(z.literal("")),
  startDate: z.string().regex(isoDate).optional().or(z.literal("")),
  kind: z.enum(["STANDARD", "ROUTINE", "DELIVERY", "UMBRELLA"]),
  status: z.enum(["ACTIVE", "QUEUED", "PAUSED"]),
  cadence: z.string().trim().max(120, { error: "Massimo 120 caratteri." }).optional().or(z.literal("")),
  // "NONE" = nessuno (Radix Select non accetta valori vuoti).
  afterId: z.string().min(1),
  umbrellaId: z.string().min(1),
});

export const DailySchema = z.object({
  title: z.string().trim().min(2, { error: "Il titolo deve avere almeno 2 caratteri." }).max(140),
  date: z.string().regex(isoDate, { error: "Scegli un giorno." }),
  assigneeId: z.string().min(1, { error: "Seleziona un responsabile." }),
  // "NONE" = daily libera, senza obiettivo (Radix Select non accetta valori vuoti).
  objectiveId: z.string().min(1),
  description: z.string().trim().max(200, { error: "Massimo 200 caratteri." }).optional().or(z.literal("")),
  instructions: z.string().trim().max(3000, { error: "Massimo 3000 caratteri." }).optional().or(z.literal("")),
  notes: z.string().trim().max(2000, { error: "Massimo 2000 caratteri." }).optional().or(z.literal("")),
});

const clockTime = /^([01]\d|2[0-3]):[0-5]\d$/;

export const EventSchema = z
  .object({
    title: z.string().trim().min(2, { error: "Il titolo deve avere almeno 2 caratteri." }).max(140),
    startDate: z.string().regex(isoDate, { error: "Scegli un giorno." }),
    endDate: z.string().regex(isoDate).optional().or(z.literal("")),
    startTime: z.string().regex(clockTime, { error: "Orario non valido." }).optional().or(z.literal("")),
    endTime: z.string().regex(clockTime, { error: "Orario non valido." }).optional().or(z.literal("")),
    // "TEAM" = riguarda tutto il team (Radix Select non accetta valori vuoti).
    personId: z.string().min(1),
  })
  .superRefine((value, ctx) => {
    const end = value.endDate || value.startDate;
    if (end < value.startDate) {
      ctx.addIssue({ code: "custom", path: ["endDate"], message: "La fine non può essere prima dell'inizio." });
    }
    if (value.endTime && !value.startTime) {
      ctx.addIssue({ code: "custom", path: ["startTime"], message: "Indica anche l'ora di inizio." });
    }
    if (value.startTime && value.endTime && end === value.startDate && value.endTime <= value.startTime) {
      ctx.addIssue({ code: "custom", path: ["endTime"], message: "L'ora di fine deve essere dopo l'inizio." });
    }
  });
