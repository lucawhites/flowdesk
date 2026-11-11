import { WorkPage } from "@/components/work/work-page";

export default async function ObiettiviPage({
  searchParams,
}: {
  searchParams: Promise<{ progetto?: string; vista?: string; filtro?: string }>;
}) {
  const { progetto, vista, filtro } = await searchParams;
  return (
    <WorkPage
      tab="obiettivi"
      projectFilter={progetto ?? null}
      scope={vista === "team" ? "team" : vista === "mie" ? "mine" : null}
      lateOnly={filtro === "ritardo"}
    />
  );
}
