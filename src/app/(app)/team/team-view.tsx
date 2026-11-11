import { CalendarCheck2, CheckCircle2, ListChecks, TriangleAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/stat-card";
import { initials } from "@/lib/utils";
import type { TeamMember } from "@/lib/types";

type MemberStat = TeamMember & { todayTotal: number; todayDone: number; weekDone: number; openObjectives: number };

export function TeamView({
  teamName,
  currentUserId,
  totals,
  memberStats,
  projects,
}: {
  teamName: string;
  currentUserId: string;
  totals: { doneToday: number; todayTotal: number; doneThisWeek: number; late: number };
  memberStats: MemberStat[];
  projects: { id: string; name: string; progress: number | null; objectives: number }[];
}) {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Panoramica {teamName}</h1>
        <p className="text-sm text-muted-foreground">Come sta andando il team oggi e in settimana.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={CalendarCheck2} label="Daily di oggi" value={totals.todayTotal} />
        <StatCard icon={CheckCircle2} label="Completate oggi" value={totals.doneToday} tone="success" />
        <StatCard icon={ListChecks} label="Completate in settimana" value={totals.doneThisWeek} tone="primary" />
        <StatCard icon={TriangleAlert} label="In ritardo" value={totals.late} tone="danger" />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Avanzamento progetti</h2>
        <Card>
          <CardContent className="flex flex-col gap-4 p-5">
            {projects.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ancora nessun progetto.</p>
            ) : (
              projects.map((p) => (
                <div key={p.id}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{p.name}</span>
                    <span className="text-muted-foreground">{p.progress === null ? "—" : `${p.progress}%`}</span>
                  </div>
                  <Progress value={p.progress ?? 0} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Per persona</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {memberStats.map((m) => {
            const rate = m.todayTotal > 0 ? Math.round((m.todayDone / m.todayTotal) * 100) : 0;
            return (
              <Card key={m.id}>
                <CardContent className="flex flex-col gap-3 p-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{initials(m.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {m.name} {m.id === currentUserId && <span className="text-muted-foreground">(tu)</span>}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        Oggi {m.todayDone}/{m.todayTotal} · settimana {m.weekDone} · {m.openObjectives} obiettivi aperti
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{rate}%</span>
                  </div>
                  <Progress value={rate} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
