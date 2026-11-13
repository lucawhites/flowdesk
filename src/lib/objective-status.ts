// Regole di stato degli obiettivi condivise da server e browser (niente accessi al database).

export type ObjectiveStatus = "ACTIVE" | "QUEUED" | "PAUSED";
export type ObjectiveKind = "STANDARD" | "ROUTINE" | "DELIVERY" | "UMBRELLA";

/** Obiettivi normali attivi contemporaneamente per persona. Routine, consegne e ombrelli non contano. */
export const ACTIVE_LIMIT = 3;

/** Quanti obiettivi in cima alla coda l'agente può far avanzare con i posti rimasti liberi. */
export const QUEUE_LOOKAHEAD = 2;

/** Lunghezza massima della cadenza di una routine. */
export const CADENCE_MAX = 120;

export const STATUS_LABEL: Record<ObjectiveStatus, string> = {
  ACTIVE: "Attivo",
  QUEUED: "In coda",
  PAUSED: "In pausa",
};

export const KIND_LABEL: Record<ObjectiveKind, string> = {
  STANDARD: "Obiettivo",
  ROUTINE: "Routine",
  DELIVERY: "Consegna",
  UMBRELLA: "Ombrello",
};

export const KIND_HINT: Record<ObjectiveKind, string> = {
  STANDARD: "Conta nel limite di 3 attivi a persona.",
  ROUTINE: "Attività che non finisce mai, con una cadenza fissa. Ha posti propri.",
  DELIVERY: "Consegna di Produzione con data fissa: usa i posti riservati alla Produzione.",
  UMBRELLA: "Si riempie con gli obiettivi collegati e non genera daily.",
};

/** Conta nel limite di attivi: obiettivo normale, attivo e non ancora raggiunto. */
export function countsAsActive(o: { kind: ObjectiveKind; status: ObjectiveStatus; reached: boolean }) {
  return o.kind === "STANDARD" && o.status === "ACTIVE" && !o.reached;
}

/**
 * Un obiettivo in coda può partire se la data di inizio è arrivata e
 * l'obiettivo da cui dipende ("Parte dopo") è al 100%.
 */
export function isReadyToStart(
  o: { startDate: string | null; afterReached: boolean | null },
  today: string,
) {
  return (!o.startDate || o.startDate <= today) && o.afterReached !== false;
}
