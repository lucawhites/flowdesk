import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarCheck2 } from "lucide-react";
import { requireSessionUser } from "@/lib/dal";
import { getObjectiveDailies, getTeamWork } from "@/lib/queries";
import { DailyRow } from "@/components/daily-item";
import { EmptyState } from "@/components/empty-state";
import { ObjectiveCard } from "@/components/objective-card";

export default async function ObjectivePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireSessionUser();
  const [{ today, members, projects, objectives }, dailies] = await Promise.all([
    getTeamWork(user.teamId),
    getObjectiveDailies(user.teamId, id),
  ]);
  const objective = objectives.find((o) => o.id === id);
  if (!objective) notFound();

  const projectOptions = projects.map((p) => ({ id: p.id, name: p.name }));
  const objectiveOptions = objectives
    .filter((o) => !o.reached || o.id === id)
    .map((o) => ({ id: o.id, title: o.title, projectName: o.project.name }));
  // Prima quelle da fare, in ordine di data; poi le completate, dalla più recente.
  const open = dailies.filter((d) => d.completedOn === null);
  const done = dailies.filter((d) => d.completedOn !== null).reverse();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link
        href={`/progetti/${objective.project.id}`}
        className="flex items-center gap-1 self-start text-xs font-medium text-accent hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> {objective.project.name}
      </Link>

      <ObjectiveCard
        variant="detail"
        objective={objective}
        members={members}
        projects={projectOptions}
        objectiveOptions={objectiveOptions}
        currentUserId={user.id}
        currentUserRole={user.role}
        today={today}
      />

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Daily collegate{dailies.length > 0 && ` · ${done.length} di ${dailies.length} completate`}
        </h2>
        {dailies.length === 0 ? (
          <EmptyState icon={CalendarCheck2} message="Nessuna daily collegata a questo obiettivo." />
        ) : (
          [...open, ...done].map((d) => (
            <DailyRow
              key={d.id}
              daily={d}
              members={members}
              objectives={objectiveOptions}
              currentUserId={user.id}
              currentUserRole={user.role}
              today={today}
              showAssignee
              showDate
            />
          ))
        )}
      </section>
    </div>
  );
}
