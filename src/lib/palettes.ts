// Palette di colori dell'app, scelte in Impostazioni e salvate nell'account (User.palette).
// I valori dei colori stanno in globals.css ([data-palette="…"] su <html>); qui nomi e anteprime.
export const PALETTES = [
  {
    id: "graphite",
    name: "Grafite e arancio",
    note: "Quella di Flowdesk: grigi neutri e arancio Elitter.",
    preview: { light: ["#f6f6f7", "#ffffff", "#18181b", "#cc4a1c"], dark: ["#0b0b0c", "#18181b", "#fafafa", "#f27a4c"] },
  },
  {
    id: "indigo",
    name: "Indaco",
    note: "Freddo e pulito, da app di produttività.",
    preview: { light: ["#f7f8fa", "#ffffff", "#0f172a", "#4f46e5"], dark: ["#0a0c11", "#141821", "#f1f5f9", "#818cf8"] },
  },
  {
    id: "teal",
    name: "Ottanio",
    note: "Verde petrolio elegante, si sposa con la pelle.",
    preview: { light: ["#f5f7f6", "#ffffff", "#111816", "#0f766e"], dark: ["#0a0f0e", "#141b1a", "#f1f5f4", "#2dd4bf"] },
  },
  {
    id: "warm",
    name: "Calda moderna",
    note: "Toni caldi come la prima Flowdesk, più contrastati.",
    preview: { light: ["#faf9f7", "#ffffff", "#1c1917", "#c2410c"], dark: ["#0e0d0c", "#1c1a18", "#fafaf9", "#fb923c"] },
  },
] as const;

export type PaletteId = (typeof PALETTES)[number]["id"];
export const DEFAULT_PALETTE: PaletteId = "graphite";

export function isPaletteId(value: unknown): value is PaletteId {
  return typeof value === "string" && PALETTES.some((p) => p.id === value);
}

/** Applica la palette alla pagina e la ricorda sul dispositivo (per mostrarla subito all'apertura). */
export function applyPalette(id: PaletteId) {
  if (id === DEFAULT_PALETTE) delete document.documentElement.dataset.palette;
  else document.documentElement.dataset.palette = id;
  try {
    localStorage.setItem("palette", id);
  } catch {
    // Navigazione privata: vale solo per questa visita.
  }
}
