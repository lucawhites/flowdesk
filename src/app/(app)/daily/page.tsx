import { WorkPage } from "@/components/work/work-page";

// /daily?nuova=1&titolo=… apre subito "Nuova daily" (col titolo già scritto):
// è il link da usare nei Comandi rapidi dell'iPhone o in un segnalibro.
export default async function DailyPage({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string; nuova?: string; titolo?: string }>;
}) {
  const { vista, nuova, titolo } = await searchParams;
  const newDaily = nuova !== undefined || titolo !== undefined ? { title: (titolo ?? "").slice(0, 200) } : null;
  return <WorkPage tab="daily" scope={vista === "team" ? "team" : null} newDaily={newDaily} />;
}
