import { redirect } from "next/navigation";

// Vecchio indirizzo della scheda Task (con ?vista=...): resta per i link salvati.
export default async function TasksPage({ searchParams }: { searchParams: Promise<{ vista?: string }> }) {
  const { vista } = await searchParams;
  redirect(vista === "obiettivi" || vista === "progetti" ? `/${vista}` : "/daily");
}
