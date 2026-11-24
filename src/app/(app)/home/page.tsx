import Link from "next/link";
import { ArrowRight, CalendarCheck2 } from "lucide-react";
import { CalendarIcon, CalendarTodoIcon, DailyIcon, ObjectivesIcon, WarningIcon } from "@/components/tab-icons";
import { requireSessionUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { getTeamWork } from "@/lib/queries";
import { addDaysISO, formatISO, isoToDateColumn, romeISO, startOfWeekISO, todayISO } from "@/lib/dates";
import { getTeamEvents } from "@/lib/calendar";
import { eventSummary, eventsOnDay } from "@/lib/calendar-helpers";
import { dailiesForToday, isObjectiveLate, sortDailies } from "@/lib/daily-helpers";
import { StatCard } from "@/components/stat-card";
import { HomeTiles } from "@/components/home-tiles";
import { DailyRow } from "@/components/daily-item";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { QuickAddDaily } from "@/components/quick-add-daily";
import { WeekHero } from "@/components/home/week-hero";
import { WeekStrip } from "@/components/home/week-strip";
import { ProgressRing } from "@/components/progress-ring";
import { cn } from "@/lib/utils";

export default async function HomePage() {
  const user = await requireSessionUser();
  const now = todayISO();
  const monday = startOfWeekISO(now);
  const sunday = addDaysISO(monday, 6);
  const tomorrowISO = addDaysISO(now, 1);
  const [{ today, members, projects, objectives, dailies }, prefs, events, completions] = await Promise.all([
    getTeamWork(user.teamId),
    prisma.user.findUnique({ where: { id: user.id }, select: { homeOrder: true } }),
    getTeamEvents(user.teamId, monday, tomorrowISO > sunday ? tomorrowISO : sunday),
    // Daily completate negli ultimi 14 giorni: andamento e confronto con la settimana prima.
    prisma.daily.findMany({
      where: { teamId: user.teamId, completedAt: { gte: isoToDateColumn(addDaysISO(now, -15)) } },
      select: { completedAt: true, assigneeId: true },
    }),
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

  // Cose che richiedono attenzione: daily di oggi ancora aperte e obiettivi in ritardo.
  const attention = myPendingToday + myLateObjectives;
  const attentionParts = [
    myPendingToday > 0 ? `${myPendingToday} daily da fare` : null,
    myLateObjectives > 0 ? `${myLateObjectives} ${myLateObjectives === 1 ? "obiettivo" : "obiettivi"} in ritardo` : null,
  ].filter(Boolean);

  // Settimana del team (da lunedì a domenica).
  const weekDailies = dailies.filter((d) => d.date >= monday && d.date <= sunday);
  const weekDone = weekDailies.filter((d) => d.completedOn !== null).length;
  const weekPercent = weekDailies.length ? Math.round((weekDone / weekDailies.length) * 100) : 0;
  const teamPendingToday = teamToday.length - teamDoneToday;
  const teamLate = openObjectives.filter((o) => isObjectiveLate(o, today)).length;
  const heroPeople = members.map((m) => {
    const mine = weekDailies.filter((d) => d.assignee.id === m.id);
    return { id: m.id, name: m.name, done: mine.filter((d) => d.completedOn !== null).length, total: mine.length };
  });
  const headline =
    weekDailies.length === 0
      ? "Settimana appena iniziata: ancora nessuna daily."
      : weekPercent >= 75
        ? `Il team è a buon punto: ${weekPercent}% delle daily della settimana fatte.`
        : weekPercent >= 40
          ? `A metà strada: ${weekPercent}% delle daily della settimana fatte.`
          : `Settimana in salita: ${weekPercent}% delle daily fatte finora.`;

  // Le mie daily completate giorno per giorno (ultimi 7 giorni) e confronto coi 7 prima.
  const myCompletions = completions.filter((c) => c.assigneeId === user.id && c.completedAt).map((c) => romeISO(c.completedAt!));
  const last7 = Array.from({ length: 7 }, (_, i) => addDaysISO(today, i - 6));
  const myTrend = last7.map((day) => myCompletions.filter((d) => d === day).length);
  const thisWeekCount = myCompletions.filter((d) => d > addDaysISO(today, -7)).length;
  const prevWeekCount = myCompletions.filter((d) => d <= addDaysISO(today, -7) && d > addDaysISO(today, -14)).length;
  const myDelta = prevWeekCount > 0 ? Math.round(((thisWeekCount - prevWeekCount) / prevWeekCount) * 100) : null;

  // Pallini della riga settimana nel calendario.
  const weekMarks: Record<string, "event" | "absence"> = {};
  for (let i = 0; i < 7; i++) {
    const day = addDaysISO(monday, i);
    const onDay = eventsOnDay(events, day);
    if (onDay.length) weekMarks[day] = onDay.some((e) => e.absence) ? "absence" : "event";
  }

  const objectiveOptions = openObjectives.map((o) => ({ id: o.id, title: o.title, projectName: o.project.name }));
  const firstName = (user.name ?? "").split(" ")[0];

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
              {attention > 0 ? (
                <>
                  <span className="font-semibold text-accent">
                    {attention} {attention === 1 ? "cosa richiede" : "cose richiedono"} la tua attenzione
                  </span>
                  : {attentionParts.join(", ")}.
                </>
              ) : (
                "Sei in pari: niente da recuperare oggi."
              )}
            </p>
          </div>

          {/* Riepilogo del calendario: solo eventi inseriti a mano, niente daily. */}
          <Link
            href="/calendario"
            className="group flex flex-col gap-2 border-t border-border pt-4 outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-80 sm:shrink-0 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0"
          >
            <p className="flex items-center gap-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <CalendarIcon className="h-4 w-4" /> In calendario
              <ArrowRight className="ml-auto h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
            </p>
            <WeekStrip today={today} monday={monday} marks={weekMarks} />
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

      <WeekHero
        done={weekDone}
        total={weekDailies.length}
        headline={headline}
        stats={[
          { value: weekDone, label: "daily fatte in settimana" },
          { value: teamPendingToday, label: "ancora da fare oggi" },
          { value: teamLate, label: teamLate === 1 ? "obiettivo in ritardo" : "obiettivi in ritardo" },
        ]}
        people={heroPeople}
      />

      <HomeTiles
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
        tiles={byHomeOrder([
          {
            id: "daily-todo",
            node: <StatCard icon={CalendarTodoIcon} label="Daily da fare oggi" value={myPendingToday} tone="primary" href="/daily" />,
          },
          {
            id: "done-today",
            node: (
              <StatCard
                icon={DailyIcon}
                label="Completate oggi"
                value={myDoneToday}
                tone="success"
                href="/daily"
                trend={myTrend}
                delta={myDelta}
              />
            ),
          },
          {
            id: "objectives",
            node: <StatCard icon={ObjectivesIcon} label="Tuoi obiettivi aperti" value={myObjectives.length} tone="info" href="/obiettivi?vista=mie" />,
          },
          {
            id: "late",
            node: <StatCard icon={WarningIcon} label="Tuoi in ritardo" value={myLate} tone="danger" href={lateHref} />,
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
                className="rounded-2xl border border-border bg-card shadow-sm outline-none transition-colors hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring"
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <ProgressRing id={c.id} done={c.done} total={c.total} />
                  <div className="min-w-0 flex-1">
                    <p className="mb-1 text-xs font-semibold text-muted-foreground">{c.title}</p>
                    {c.total > 0 ? (
                      <>
                        <p className="text-xl font-semibold text-foreground">
                          {c.done} <span className="text-sm font-normal text-muted-foreground">di {c.total} fatte</span>
                        </p>
                        <p className={cn("mt-0.5 text-xs", c.done >= c.total ? "text-success" : "text-muted-foreground")}>
                          {c.done >= c.total ? "Tutto completato" : `${c.total - c.done} da fare`}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Nessuna daily per oggi</p>
                    )}
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
          <QuickAddDaily userId={user.id} today={today} />
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
