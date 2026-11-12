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
  notes: string | null;
  /** Ordine scelto a mano; null = in coda. */
  position: number | null;
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

/** dailies = quante daily sono collegate al passo (servono all'avviso prima di cancellarlo). */
export type ObjectiveStepItem = { id: string; position: number; title: string; done: boolean; dailies: number };

/** Limiti dei passi di un obiettivo. */
export const STEP_TITLE_MAX = 200;
export const MAX_STEPS = 30;

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

/** Tessere riordinabili della Home, nell'ordine standard. */
export const HOME_TILE_IDS = ["daily-todo", "done-today", "objectives", "late", "donut-mine", "donut-team"] as const;
export type HomeTileId = (typeof HOME_TILE_IDS)[number];

/** Evento del calendario (assenza, appuntamento…) inserito a mano. */
export type CalendarEventItem = {
  id: string;
  title: string;
  startDate: string;
  /** Uguale a startDate per gli eventi di un giorno solo; estremi inclusi. */
  endDate: string;
  /** "HH:MM" oppure null (tutto il giorno). */
  startTime: string | null;
  endTime: string | null;
  absence: boolean;
  /** Chi riguarda; null = tutto il team. */
  person: Person | null;
  creatorId: string;
};
