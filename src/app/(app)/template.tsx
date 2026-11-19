import { ViewTransition, type ReactNode } from "react";

// Passaggio animato tra le pagine dell'app: il template si rimonta a ogni navigazione,
// quindi la pagina vecchia sfuma e la nuova entra salendo di poco (stili in globals.css).
// Aggiornamenti della stessa pagina (spunte, router.refresh) non animano: default="none".
// Intestazione e barra in basso restano ferme (view-transition-name in layout).
export default function AppTemplate({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="page-in" exit="page-out" default="none">
      <div>{children}</div>
    </ViewTransition>
  );
}
