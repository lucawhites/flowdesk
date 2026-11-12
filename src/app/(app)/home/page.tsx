import Link from "next/link";
import { ArrowRight, CalendarCheck2, CalendarDays, CheckCircle2, Target, TriangleAlert } from "lucide-react";
import { requireSessionUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { getTeamWork } from "@/lib/queries";
import { addDaysISO, formatISO, todayISO } from "@/lib/dates";
import { getTeamEvents } from "@/lib/calendar";
import { eventSummary, eventsOnDay } from "@/lib/calendar-helpers";
import { dailiesForToday, isObjectiveLate, sortDailies } from "@/lib/daily-helpers";
import { StatCard } from "@/components/stat-card";
import { HomeTiles } from "@/components/home-tiles";
import { DailyRow } from "@/components/daily-item";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DonutChart, DonutLegend } from "@/components/donut-chart";
import { cn } from "@/lib/utils";

export default async function HomePage() {
  const user = await requireSessionUser();
  const [{ today, members, projects, objectives, dailies }, prefs, events] = await Promise.all([
    getTeamWork(user.teamId),
    prisma.user.findUnique({ where: { id: user.id }, select: { homeOrder: true } }),
    getTeamEvents(user.teamId, todayISO(), addDaysISO(todayISO(), 1)),
  ]);
  const todayEvents = eventsOnDay(events, today);
  const tomorrowEvents = eventsOnDay(events, addDaysISO(today, 1));
  // Ordine personale delle tessere: quelle mai spostate restano in coda, nell'ordine standard.
  const homeOrder = prefs?.homeOrder ?? [];
  const byHomeOrder = <T extends { id: string }>(tiles: T[]) => {
    const rank = (id: string) => (homeOrder.includes(id) ? homeOrder.indexOf(id) : homeOrder.length);
    return [...tiles].sort((a, b) => rank(a.id) - rank(b.id));
  };

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
        <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-stretch sm:gap-6">
          <div className="sm:flex-1">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {formatISO(today, "EEEE d MMMM yyyy")}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">Ciao {firstName}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {myPendingToday > 0
                ? `Hai ${myPendingToday} daily ancora da completare oggi.`
                : "Sei in pari con le daily di oggi."}
            </p>
          </div>

          {/* Riepilogo del calendario: solo eventi inseriti a mano, niente daily. */}
          <Link
            href="/calendario"
            className="group flex flex-col gap-2 border-t border-border pt-4 outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-72 sm:shrink-0 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0"
          >
            <p className="flex items-center gap-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" /> In calendario
              <ArrowRight className="ml-auto h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
            </p>
            {[
              { label: "Oggi", items: todayEvents, max: 3 },
              { label: "Domani", items: tomorrowEvents, max: 2 },
            ].map(({ label, items, max }) => (
              <div key={label} className="flex gap-2 text-sm">
                <p className="w-14 shrink-0 font-medium text-foreground">{label}</p>
                <div className="min-w-0 flex-1">
                  {items.length === 0 ? (
                    <p className="text-muted-foreground">Nessun evento</p>
                  ) : (
                    <>
                      {items.slice(0, max).map((event) => (
                        <p key={event.id} className="flex items-baseline gap-1.5 text-foreground">
                          <span
                            aria-hidden
                            className={cn("h-1.5 w-1.5 shrink-0 -translate-y-0.5 rounded-full", event.absence ? "bg-warning" : "bg-accent")}
                          />
                          <span className="min-w-0">{eventSummary(event)}</span>
                        </p>
                      ))}
                      {items.length > max && <p className="text-xs text-muted-foreground">+{items.length - max} altri</p>}
                    </>
                  )}
                </div>
              </div>
            ))}
          </Link>
        </CardContent>
      </Card>

      <HomeTiles
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
        tiles={byHomeOrder([
          {
            id: "daily-todo",
            node: <StatCard icon={CalendarCheck2} label="Daily da fare oggi" value={myPendingToday} tone="primary" href="/daily" />,
          },
          {
            id: "done-today",
            node: <StatCard icon={CheckCircle2} label="Completate oggi" value={myDoneToday} tone="success" href="/daily" />,
          },
          {
            id: "objectives",
            node: <StatCard icon={Target} label="Tuoi obiettivi aperti" value={myObjectives.length} tone="warning" href="/obiettivi?vista=mie" />,
          },
          {
            id: "late",
            node: <StatCard icon={TriangleAlert} label="Tuoi in ritardo" value={myLate} tone="danger" href={lateHref} />,
          },
        ])}
      />

      <HomeTiles
        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        tiles={byHomeOrder(
          [
            { id: "donut-mine", title: "Le tue daily di oggi", done: myDoneToday, total: myToday.length, href: "/daily" },
            { id: "donut-team", title: "Daily del team oggi", done: teamDoneToday, total: teamToday.length, href: "/daily?vista=team" },
          ].map((c) => ({
            id: c.id,
            node: (
              <Link
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
            ),
          }))
        )}
      />

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
                      <p className="truncate text-[0.6875rem] text-muted-foreground">
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
