// Tema dell'app e colore della barra di stato (ora, batteria) / barra di Safari.
// Scelte: "light", "dark" o "auto" (predefinita: segue l'aspetto dell'iPhone o del computer).
// Nell'app installata iOS colora la barra di stato in base al PROPRIO aspetto: solo con
// "auto" barra e app coincidono sempre.
export const THEME_COLORS = { light: "#fcfcfc", dark: "#141415" } as const;

export type ThemeChoice = "light" | "dark" | "auto";

export function readThemeChoice(): ThemeChoice {
  try {
    const value = localStorage.getItem("theme");
    return value === "light" || value === "dark" ? value : "auto";
  } catch {
    return "auto";
  }
}

export function applyThemeChoice(choice: ThemeChoice) {
  try {
    if (choice === "auto") localStorage.removeItem("theme");
    else localStorage.setItem("theme", choice);
  } catch {
    // Navigazione privata: la scelta vale solo per questa visita.
  }
  const dark = choice === "dark" || (choice === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  syncThemeColor();
}

/** Allinea i meta theme-color: tema fisso = un solo colore; automatico = chiaro/scuro di sistema. */
export function syncThemeColor() {
  const metas = Array.from(document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]'));
  const choice = readThemeChoice();
  if (choice === "auto") {
    metas.forEach((meta, i) => {
      const scheme = i === 0 ? "light" : "dark";
      meta.setAttribute("media", `(prefers-color-scheme: ${scheme})`);
      meta.setAttribute("content", THEME_COLORS[scheme]);
    });
    return;
  }
  metas.forEach((meta) => {
    meta.setAttribute("content", THEME_COLORS[choice]);
    meta.removeAttribute("media");
  });
}
