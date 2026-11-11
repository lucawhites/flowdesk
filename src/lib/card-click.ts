import type { MouseEvent } from "react";

const INTERACTIVE = "a, button, input, textarea, select, label, summary, form, [role='menuitem'], [role='checkbox'], [role='dialog']";

/**
 * onClick per rendere cliccabile un'intera card senza rubare i clic a ciò che
 * contiene (spunte, menù, pulsanti, link). Ignora anche i clic che arrivano da
 * finestre aperte dalla card: React li fa risalire fin qui anche se sono in un portale.
 */
export function cardClick(open: () => void) {
  return (event: MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (!event.currentTarget.contains(target)) return;
    if (target.closest(INTERACTIVE)) return;
    if (window.getSelection()?.toString()) return;
    open();
  };
}
