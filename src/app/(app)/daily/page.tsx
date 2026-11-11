import { WorkPage } from "@/components/work/work-page";

export default async function DailyPage({ searchParams }: { searchParams: Promise<{ vista?: string }> }) {
  const { vista } = await searchParams;
  return <WorkPage tab="daily" scope={vista === "team" ? "team" : null} />;
}
