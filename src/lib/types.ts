// Dati serializzati passati dai Server Component ai componenti client.
// Le date sono stringhe "YYYY-MM-DD" (fuso Europe/Rome), mai oggetti Date.

export type Role = "ADMIN" | "MEMBER";

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: Role;
  areas: string[];
};

export type Person = { id: string; name: string };

export type DailyItem = {
  id: string;
  title: string;
  date: string;
  /** Giorno di completamento (fuso italiano), null se ancora da fare. */
  completedOn: string | null;
  assignee: Person;
  creatorId: string;
  objective: { id: string; title: string; projectName: string } | null;
  step: { id: string; title: string } | null;
  /** Creata dall'agente pianificatore. */
  byAgent: boolean;
};

export type ObjectiveItem = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  assignee: Person;
  creatorId: string;
  project: { id: string; name: string };
  dailyTotal: number;
  dailyDone: number;
  stepTotal: number;
  stepDone: number;
  /** Passi completati / passi (o daily fatte / daily se non ha passi). */
  progress: number;
  /** Avanzamento al 100% con almeno un passo o una daily. */
  reached: boolean;
  inFocus: boolean;
  metric: ObjectiveMetric | null;
  steps: ObjectiveStepItem[];
  dailies: { id: string; title: string; date: string; done: boolean; assigneeName: string }[];
};

export type ObjectiveMetric = {
  label: string;
  unit: string | null;
  target: number | null;
  current: number | null;
  approved: boolean;
};

export type ObjectiveStepItem = { id: string; position: number; title: string; done: boolean };

export type ProjectItem = {
  id: string;
  name: string;
  description: string | null;
  objectives: ObjectiveItem[];
  progress: number | null;
};

export type ObjectiveOption = { id: string; title: string; projectName: string };

export type FormState =
  | {
      errors?: Record<string, string[] | undefined>;
      message?: string;
      ok?: boolean;
    }
  | undefined;

/** Lunghezza massima delle istruzioni libere per l'agente pianificatore. */
export const AGENT_INSTRUCTIONS_MAX = 2000;
