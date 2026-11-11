// Dati serializzati passati dai Server Component ai componenti client.
// Le date sono stringhe "YYYY-MM-DD" (fuso Europe/Rome), mai oggetti Date.

export type Role = "ADMIN" | "MEMBER";

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: Role;
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
  progress: number;
  dailies: { id: string; title: string; date: string; done: boolean; assigneeName: string }[];
};

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
