// Colore della barra di stato (ora, batteria) dell'app installata e della barra di Safari.
// Segue il tema scelto in Flowdesk, non quello dell'iPhone: è il colore dell'intestazione
// in vetro sopra lo sfondo, così barra di stato e intestazione sembrano un pezzo solo.
export const THEME_COLORS = { light: "#fcfcfc", dark: "#141415" } as const;

export function syncThemeColor() {
  const dark = document.documentElement.dataset.theme === "dark";
  const color = dark ? THEME_COLORS.dark : THEME_COLORS.light;
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
    meta.setAttribute("content", color);
    meta.removeAttribute("media");
  });
}
