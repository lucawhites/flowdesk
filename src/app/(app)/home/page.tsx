import Link from "next/link";
import { ArrowRight, CalendarCheck2, CheckCircle2, Target, TriangleAlert } from "lucide-react";
import { requireSessionUser } from "@/lib/dal";
import { getTeamWork } from "@/lib/queries";
import { formatISO } from "@/lib/dates";
import { dailiesForToday, isObjectiveLate, sortDailies } from "@/lib/daily-helpers";
import { StatCard } from "@/components/stat-card";
import { DailyRow } from "@/components/daily-item";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DonutChart, DonutLegend } from "@/components/donut-chart";
import { cn } from "@/lib/utils";

export default async function HomePage() {
  const user = await requireSessionUser();
  const { today, members, projects, objectives, dailies } = await getTeamWork(user.teamId);

  const teamToday = dailiesForToday(dailies, today);
  const myToday = sortDailies(teamToday.filter((d) => d.assignee.id === user.id));
  const myDoneToday = myToday.filter((d) => d.completedOn !== null).length;
  const myPendingToday = myToday.length - myDoneToday;
  const teamDoneToday = teamToday.filter((d) => d.completedOn !== null).length;

  const openObjectives = objectives.filter((o) => !o.reached);
  const myObjectives = openObjectives.filter((o) => o.assignee.id === user.id);
  const myLateObjectives = myObjectives.filter((o) => isObjectiveLate(o, today)).length;
  const myLate = myLateObjectives + myToday.filter((d) => d.date < today && d.completedOn === null).length;
  // Se in ritardo ci sono solo daily riportate, si va alle daily.
  const lateHref = myLateObjectives > 0 ? "/obiettivi?vista=mie&filtro=ritardo" : "/daily";

  const objectiveOptions = openObjectives.map((o) => ({ id: o.id, title: o.title, projectName: o.project.name }));
  const firstName = (user.name ?? "").split(" ")[0];
  const pct = (done: number, total: number) => (total > 0 ? Math.round((done / total) * 100) : 0);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {formatISO(today, "EEEE d MMMM yyyy")}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">Ciao {firstName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {myPendingToday > 0
              ? `Hai ${myPendingToday} daily ancora da completare oggi.`
              : "Sei in pari con le daily di oggi."}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={CalendarCheck2} label="Daily da fare oggi" value={myPendingToday} tone="primary" href="/daily" />
        <StatCard icon={CheckCircle2} label="Completate oggi" value={myDoneToday} tone="success" href="/daily" />
        <StatCard icon={Target} label="Tuoi obiettivi aperti" value={myObjectives.length} tone="warning" href="/obiettivi?vista=mie" />
        <StatCard icon={TriangleAlert} label="Tuoi in ritardo" value={myLate} tone="danger" href={lateHref} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[
          { title: "Le tue daily di oggi", done: myDoneToday, total: myToday.length, href: "/daily" },
          { title: "Daily del team oggi", done: teamDoneToday, total: teamToday.length, href: "/daily?vista=team" },
        ].map((c) => (
          <Link
            key={c.title}
            href={c.href}
            className="rounded-2xl border border-border bg-surface shadow-sm outline-none transition-colors hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <CardContent className="flex items-center gap-4 p-4">
              <DonutChart
                segments={[
                  { label: "Completate", value: c.done, colorVar: "--success" },
                  { label: "Da fare", value: c.total - c.done, colorVar: "--accent" },
                ]}
                size={96}
                strokeWidth={14}
                centerLabel={`${pct(c.done, c.total)}%`}
              />
              <div className="flex-1">
                <p className="mb-2 text-xs font-semibold text-muted-foreground">{c.title}</p>
                <DonutLegend
                  segments={[
                    { label: "Completate", value: c.done, colorVar: "--success" },
                    { label: "Da fare", value: c.total - c.done, colorVar: "--accent" },
                  ]}
                />
              </div>
            </CardContent>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="flex flex-col gap-3 lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground">Le tue daily di oggi</h2>
            <Link href="/daily" className="flex items-center gap-1 text-xs font-medium text-accent hover:underline">
              Vedi tutte <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {myToday.length === 0 ? (
            <EmptyState icon={CalendarCheck2} message="Nessuna daily per oggi." />
          ) : (
            myToday.map((d) => (
              <DailyRow
                key={d.id}
                daily={d}
                members={members}
                objectives={objectiveOptions}
                currentUserId={user.id}
                currentUserRole={user.role}
                today={today}
              />
            ))
          )}
        </div>

        <div className="flex flex-col gap-3 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground">Obiettivi in corso</h2>
            <Link href="/obiettivi" className="flex items-center gap-1 text-xs font-medium text-accent hover:underline">
              Tutti <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <Card>
            <CardContent className="flex flex-col gap-4 p-4">
              {openObjectives.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  {projects.length === 0 ? "Ancora nessun progetto creato." : "Nessun obiettivo in corso."}
                </p>
              ) : (
                openObjectives.slice(0, 6).map((o) => {
                  const late = isObjectiveLate(o, today);
                  return (
                    <Link
                      key={o.id}
                      href={`/obiettivi/${o.id}`}
                      className="group block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-xs font-medium text-foreground group-hover:underline">{o.title}</p>
                        <p className={cn("text-xs", late ? "text-danger" : "text-muted-foreground")}>{o.progress}%</p>
                      </div>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {o.project.name} · {o.assignee.name}
                        {o.dueDate && ` · entro il ${formatISO(o.dueDate)}`}
                      </p>
                      <Progress value={o.progress} className="mt-1 h-1.5" indicatorClassName={cn(late && "bg-danger")} />
                    </Link>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
