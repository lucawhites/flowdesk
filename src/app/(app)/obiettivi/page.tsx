import { WorkPage } from "@/components/work/work-page";

export default async function ObiettiviPage({ searchParams }: { searchParams: Promise<{ progetto?: string }> }) {
  const { progetto } = await searchParams;
  return <WorkPage tab="obiettivi" projectFilter={progetto ?? null} />;
}
