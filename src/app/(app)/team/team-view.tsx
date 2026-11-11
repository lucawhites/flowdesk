import Link from "next/link";
import { CalendarCheck2, CheckCircle2, Target, TriangleAlert, Undo2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/stat-card";
import { WeekBars } from "@/components/kpi/week-bars";
import { formatISO } from "@/lib/dates";
import { cn, initials } from "@/lib/utils";
import type { Kpis } from "@/lib/kpi";

function SectionTitle({ children, href, linkLabel }: { children: React.ReactNode; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-sm font-semibold text-foreground">{children}</h2>
      {href && (
        <Link href={href} className="text-xs font-medium text-accent hover:underline">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

const lateLabel = (days: number) => (days === 1 ? "da 1 giorno" : `da ${days} giorni`);

export function TeamView({ kpis, teamName, currentUserId }: { kpis: Kpis; teamName: string; currentUserId: string }) {
  const todayRate = kpis.todayTotal > 0 ? Math.round((kpis.doneToday / kpis.todayTotal) * 100) : 0;
  const lateTotal = kpis.lateObjectives.length + kpis.lateDailies.length;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {formatISO(kpis.today, "EEEE d MMMM yyyy")}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">KPI di {teamName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Daily completate, avanzamento di obiettivi e progetti, ritardi.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={CalendarCheck2} label={`Daily oggi · ${todayRate}%`} value={`${kpis.doneToday}/${kpis.todayTotal}`} tone="primary" />
        <StatCard icon={CheckCircle2} label="Completate in settimana" value={kpis.doneThisWeek} tone="success" />
        <StatCard
          icon={Target}
          label={`Obiettivi aperti${kpis.openObjectivesProgress !== null ? ` · ${kpis.openObjectivesProgress}%` : ""}`}
          value={kpis.openObjectives}
          tone="neutral"
        />
        <StatCard icon={TriangleAlert} label="In ritardo" value={lateTotal} tone={lateTotal > 0 ? "danger" : "neutral"} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <section className="lg:col-span-3">
          <SectionTitle>Daily completate, ultimi 7 giorni</SectionTitle>
          <Card>
            <CardContent className="pt-8">
              <WeekBars days={kpis.last7Days} today={kpis.today} />
            </CardContent>
          </Card>
        </section>

        <section className="lg:col-span-2">
          <SectionTitle href="/progetti" linkLabel="Progetti">
            Avanzamento per progetto
          </SectionTitle>
          <Card>
            <CardContent className="flex flex-col gap-4">
              {kpis.projects.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ancora nessun progetto.</p>
              ) : (
                kpis.projects.map((p) => (
                  <div key={p.id}>
                    <div className="mb-1.5 flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-medium text-foreground">{p.name}</span>
                      <span className="text-sm font-semibold text-foreground">
                        {p.progress === null ? "—" : `${p.progress}%`}
                      </span>
                    </div>
                    <Progress value={p.progress ?? 0} />
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {p.objectives === 0
                        ? "Nessun obiettivo"
                        : `${p.reached} su ${p.objectives} obiettivi raggiunti`}
                      {p.late > 0 && <span className="text-danger"> · {p.late} in ritardo</span>}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>
      </div>

      <section>
        <SectionTitle>Per persona</SectionTitle>
        <Card>
          <CardContent className="p-0">
            <div className="hidden grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))] gap-3 border-b border-border px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground sm:grid">
              <span>Persona</span>
              <span>Daily oggi</span>
              <span>Settimana</span>
              <span>Obiettivi</span>
              <span>Ritardi</span>
            </div>
            <ul className="divide-y divide-border">
              {kpis.people.map((m) => (
                <li
                  key={m.id}
                  className="grid grid-cols-2 gap-x-3 gap-y-2 px-5 py-3.5 text-sm sm:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))] sm:items-center"
                >
                  <div className="col-span-2 flex items-center gap-3 sm:col-span-1">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-[11px]">{initials(m.name)}</AvatarFallback>
                    </Avatar>
                    <span className="truncate font-medium text-foreground">
                      {m.name} {m.id === currentUserId && <span className="font-normal text-muted-foreground">(tu)</span>}
                    </span>
                  </div>
                  <span className="text-foreground">
                    <span className="text-muted-foreground sm:hidden">Oggi </span>
                    {m.todayDone}/{m.todayTotal}
                  </span>
                  <span className="text-foreground">
                    <span className="text-muted-foreground sm:hidden">Settimana </span>
                    {m.weekDone}
                  </span>
                  <span className="text-foreground">
                    <span className="text-muted-foreground sm:hidden">Obiettivi </span>
                    {m.openObjectives}
                    {m.objectivesProgress !== null && <span className="text-muted-foreground"> · {m.objectivesProgress}%</span>}
                  </span>
                  <span className={cn(m.late > 0 ? "font-semibold text-danger" : "text-muted-foreground")}>
                    <span className="font-normal text-muted-foreground sm:hidden">Ritardi </span>
                    {m.late}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      <section>
        <SectionTitle>In ritardo</SectionTitle>
        {lateTotal === 0 ? (
          <Card>
            <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-success" /> Nessun elemento in ritardo.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y divide-border">
                {kpis.lateObjectives.map((o) => (
                  <li key={o.id} className="flex items-start gap-3 px-5 py-3">
                    <Target className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{o.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Obiettivo · {o.project.name} · {o.assignee.name} · {o.progress}%
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-danger">
                      Scaduto {lateLabel(o.daysLate)}
                    </span>
                  </li>
                ))}
                {kpis.lateDailies.map((d) => (
                  <li key={d.id} className="flex items-start gap-3 px-5 py-3">
                    <Undo2 className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{d.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Daily · {d.assignee.name}
                        {d.objective && ` · ${d.objective.title}`}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-warning">Riportata {lateLabel(d.daysLate)}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
