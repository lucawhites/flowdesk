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

export const TaskPeriods = ["DAILY", "WEEKLY", "MONTHLY"] as const;
export const TaskPriorities = ["LOW", "MEDIUM", "HIGH"] as const;

export const TaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, { error: "Il titolo deve avere almeno 2 caratteri." })
    .max(140),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  period: z.enum(TaskPeriods),
  priority: z.enum(TaskPriorities),
  dueDate: z.string().optional().or(z.literal("")),
  assigneeId: z.string().min(1, { error: "Seleziona un responsabile." }),
});
