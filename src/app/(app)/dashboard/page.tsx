import { redirect } from "next/navigation";

// Vecchio indirizzo della scheda task: resta per i link e i segnalibri salvati.
export default function DashboardPage() {
  redirect("/tasks");
}
