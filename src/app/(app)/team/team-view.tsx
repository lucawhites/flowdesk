"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, CircleDashed, ListTodo, TriangleAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { TaskList } from "@/components/task-list";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { initials } from "@/lib/utils";
import { PERIOD_TABS, PRIORITY_OPTIONS } from "@/lib/task-helpers";
import { StatCard } from "@/components/stat-card";
import type { TaskWithRelations, TeamMember } from "@/lib/types";

type MemberStat = TeamMember & { total: number; done: number; pending: number };
type Totals = { total: number; done: number; pending: number; overdue: number };

const STATUS_OPTIONS = [
  { value: "ALL", label: "Tutte" },
  { value: "TODO", label: "Da fare" },
  { value: "DONE", label: "Completate" },
] as const;

export function TeamView({
  tasks,
  members,
  memberStats,
  totals,
  currentUserId,
  currentUserRole,
  teamName,
}: {
  tasks: TaskWithRelations[];
  members: TeamMember[];
  memberStats: MemberStat[];
  totals: Totals;
  currentUserId: string;
  currentUserRole: "ADMIN" | "MEMBER";
  teamName: string;
}) {
  const [periodFilter, setPeriodFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [memberFilter, setMemberFilter] = useState<string>("ALL");

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (periodFilter !== "ALL" && task.period !== periodFilter) return false;
      if (priorityFilter !== "ALL" && task.priority !== priorityFilter) return false;
      if (statusFilter !== "ALL" && task.status !== statusFilter) return false;
      if (memberFilter !== "ALL" && task.assignee.id !== memberFilter) return false;
      return true;
    });
  }, [tasks, periodFilter, priorityFilter, statusFilter, memberFilter]);

  const completionRate = totals.total > 0 ? Math.round((totals.done / totals.total) * 100) : 0;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Panoramica {teamName}</h1>
        <p className="text-sm text-muted-foreground">Il quadro generale di tutte le task del team, completate e in corso.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={ListTodo} label="Task totali" value={totals.total} />
        <StatCard icon={CheckCircle2} label="Completate" value={totals.done} tone="success" />
        <StatCard icon={CircleDashed} label="Da fare" value={totals.pending} tone="primary" />
        <StatCard icon={TriangleAlert} label="In ritardo" value={totals.overdue} tone="danger" />
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Completamento complessivo</p>
            <p className="text-sm font-semibold text-foreground">{completionRate}%</p>
          </div>
          <Progress value={completionRate} />
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Per persona</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {memberStats.map((member) => {
            const rate = member.total > 0 ? Math.round((member.done / member.total) * 100) : 0;
            return (
              <Card key={member.id}>
                <CardContent className="flex flex-col gap-3 p-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{initials(member.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {member.name} {member.id === currentUserId && <span className="text-muted-foreground">(tu)</span>}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {member.done}/{member.total} completate
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

      <div>
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">Tutte le task</h2>
          <div className="flex flex-wrap gap-2">
            <Select value={memberFilter} onValueChange={setMemberFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tutti i membri</SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tutte le periodicità</SelectItem>
                {PERIOD_TABS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tutte le priorità</SelectItem>
                {PRIORITY_OPTIONS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <TaskList
          tasks={filteredTasks}
          members={members}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          showAssignee
          emptyMessage="Nessuna task corrisponde ai filtri selezionati."
        />
      </div>
    </div>
  );
}
