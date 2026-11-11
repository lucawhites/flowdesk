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
});

export const DailySchema = z.object({
  title: z.string().trim().min(2, { error: "Il titolo deve avere almeno 2 caratteri." }).max(140),
  date: z.string().regex(isoDate, { error: "Scegli un giorno." }),
  assigneeId: z.string().min(1, { error: "Seleziona un responsabile." }),
  // "NONE" = daily libera, senza obiettivo (Radix Select non accetta valori vuoti).
  objectiveId: z.string().min(1),
});
