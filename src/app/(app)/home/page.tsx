import Link from "next/link";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { ArrowRight, CalendarClock, CheckCircle2, TriangleAlert, Users2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/dal";
import { isOverdue, sortTasks } from "@/lib/task-helpers";
import { StatCard } from "@/components/stat-card";
import { TaskList } from "@/components/task-list";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { DonutChart, DonutLegend } from "@/components/donut-chart";
import { initials } from "@/lib/utils";

export default async function HomePage() {
  const user = await requireSessionUser();
  const now = new Date();
  const inSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [myTasks, teamTasks, members] = await Promise.all([
    prisma.task.findMany({
      where: { teamId: user.teamId, assigneeId: user.id },
      include: { assignee: { select: { id: true, name: true } } },
    }),
    prisma.task.findMany({ where: { teamId: user.teamId } }),
    prisma.user.findMany({
      where: { teamId: user.teamId },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const myPending = myTasks.filter((t) => t.status === "TODO");
  const todayCount = myPending.filter((t) => t.period === "DAILY").length;
  const dueThisWeekCount = myPending.filter((t) => t.dueDate && t.dueDate <= inSevenDays).length;
  const myOverdueCount = myPending.filter((t) => isOverdue(t.dueDate, t.status)).length;
  const upcoming = sortTasks(myPending).slice(0, 5);

  const teamDone = teamTasks.filter((t) => t.status === "DONE").length;
  const teamCompletion = teamTasks.length > 0 ? Math.round((teamDone / teamTasks.length) * 100) : 0;
  const teamOverdue = teamTasks.filter((t) => t.status === "TODO" && isOverdue(t.dueDate, t.status)).length;

  const myDone = myTasks.filter((t) => t.status === "DONE").length;
  const myCompletion = myTasks.length > 0 ? Math.round((myDone / myTasks.length) * 100) : 0;

  const othersTasks = teamTasks.length - myTasks.length;

  const memberStats = members
    .map((member) => {
      const total = teamTasks.filter((t) => t.assigneeId === member.id).length;
      const done = teamTasks.filter((t) => t.assigneeId === member.id && t.status === "DONE").length;
      return { ...member, total, done, rate: total > 0 ? Math.round((done / total) * 100) : 0 };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 4);

  const today = format(now, "EEEE d MMMM yyyy", { locale: it });
  const firstName = (user.name ?? "").split(" ")[0];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{today}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">Ciao {firstName} 👋</h1>
          <p className="mt-1 text-sm text-muted-foreground">Ecco il quadro generale di {user.teamName} per oggi.</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={CalendarClock} label="Task di oggi" value={todayCount} tone="primary" />
        <StatCard icon={CheckCircle2} label="In scadenza 7gg" value={dueThisWeekCount} tone="warning" />
        <StatCard icon={TriangleAlert} label="Tue in ritardo" value={myOverdueCount} tone="danger" />
        <StatCard icon={Users2} label="Completamento team" value={`${teamCompletion}%`} tone="success" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <DonutChart
              segments={[
                { label: "Completate", value: myDone, colorVar: "--success" },
                { label: "Da fare", value: myTasks.length - myDone, colorVar: "--primary" },
              ]}
              size={96}
              strokeWidth={14}
              centerLabel={`${myCompletion}%`}
            />
            <div className="flex-1">
              <p className="mb-2 text-xs font-semibold text-muted-foreground">Le tue task</p>
              <DonutLegend
                segments={[
                  { label: "Completate", value: myDone, colorVar: "--success" },
                  { label: "Da fare", value: myTasks.length - myDone, colorVar: "--primary" },
                ]}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <DonutChart
              segments={[
                { label: "Completate", value: teamDone, colorVar: "--success" },
                { label: "Da fare", value: teamTasks.length - teamDone, colorVar: "--primary" },
              ]}
              size={96}
              strokeWidth={14}
              centerLabel={`${teamCompletion}%`}
            />
            <div className="flex-1">
              <p className="mb-2 text-xs font-semibold text-muted-foreground">Tutto il team</p>
              <DonutLegend
                segments={[
                  { label: "Completate", value: teamDone, colorVar: "--success" },
                  { label: "Da fare", value: teamTasks.length - teamDone, colorVar: "--primary" },
                ]}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <DonutChart
              segments={[
                { label: "Tue", value: myTasks.length, colorVar: "--primary" },
                { label: "Del resto del team", value: othersTasks, colorVar: "--warning" },
              ]}
              size={96}
              strokeWidth={14}
              centerLabel={`${teamTasks.length > 0 ? Math.round((myTasks.length / teamTasks.length) * 100) : 0}%`}
            />
            <div className="flex-1">
              <p className="mb-2 text-xs font-semibold text-muted-foreground">Tue vs team</p>
              <DonutLegend
                segments={[
                  { label: "Tue", value: myTasks.length, colorVar: "--primary" },
                  { label: "Resto del team", value: othersTasks, colorVar: "--warning" },
                ]}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="flex flex-col gap-3 lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground">Le tue prossime task</h2>
            <Link href="/dashboard" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              Vedi tutte <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <TaskList
            tasks={upcoming}
            members={members}
            currentUserId={user.id}
            currentUserRole={user.role}
            emptyMessage="Nessuna task da completare. Sei in pari! ☕️"
          />
        </div>

        <div className="flex flex-col gap-3 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground">Il team in breve</h2>
            <Link href="/team" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              Dettagli <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <Card>
            <CardContent className="flex flex-col gap-4 p-4">
              {teamOverdue > 0 && (
                <p className="rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger">
                  {teamOverdue} task del team in ritardo.
                </p>
              )}
              <div className="flex flex-col gap-3">
                {memberStats.map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-[10px]">{initials(member.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-xs font-medium text-foreground">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.rate}%</p>
                      </div>
                      <Progress value={member.rate} className="mt-1 h-1.5" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
