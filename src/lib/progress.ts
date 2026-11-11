/** Avanzamento obiettivo: daily completate / daily collegate (0 se non ne ha). */
export function objectiveProgress(done: number, total: number) {
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

/** Avanzamento progetto: media degli obiettivi; null se non ha obiettivi. */
export function projectProgress(objectiveProgresses: number[]) {
  if (objectiveProgresses.length === 0) return null;
  return Math.round(objectiveProgresses.reduce((sum, p) => sum + p, 0) / objectiveProgresses.length);
}
