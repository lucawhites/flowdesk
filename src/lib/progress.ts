/** Percentuale intera (0 se il totale è zero). */
export function objectiveProgress(done: number, total: number) {
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

/**
 * Avanzamento obiettivo: passi completati / passi; se l'obiettivo non ha passi,
 * daily completate / daily collegate.
 */
export function objectiveProgressFrom(steps: { done: number; total: number }, dailies: { done: number; total: number }) {
  const base = steps.total > 0 ? steps : dailies;
  const progress = objectiveProgress(base.done, base.total);
  return { progress, reached: base.total > 0 && progress === 100 };
}

/** Avanzamento progetto: media degli obiettivi; null se non ha obiettivi. */
export function projectProgress(objectiveProgresses: number[]) {
  if (objectiveProgresses.length === 0) return null;
  return Math.round(objectiveProgresses.reduce((sum, p) => sum + p, 0) / objectiveProgresses.length);
}
