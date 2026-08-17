"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskList } from "@/components/task-list";
import { TaskDialog } from "@/components/task-dialog";
import { Badge } from "@/components/ui/badge";
import { PERIOD_TABS } from "@/lib/task-helpers";
import type { TaskWithRelations, TeamMember } from "@/lib/types";

type Period = "DAILY" | "WEEKLY" | "MONTHLY";

export function DashboardView({
  tasksByPeriod,
  members,
  currentUserId,
  currentUserRole,
  userName,
}: {
  tasksByPeriod: Record<Period, TaskWithRelations[]>;
  members: TeamMember[];
  currentUserId: string;
  currentUserRole: "ADMIN" | "MEMBER";
  userName: string;
}) {
  const [tab, setTab] = useState<Period>("DAILY");

  const pendingToday = tasksByPeriod.DAILY.filter((t) => t.status === "TODO").length;
  const firstName = userName.split(" ")[0];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Ciao {firstName} 👋</h1>
          <p className="text-sm text-muted-foreground">
            {pendingToday > 0
              ? `Hai ${pendingToday} task giornaliere ancora da completare.`
              : "Sei in pari con le task di oggi."}
          </p>
        </div>
        <TaskDialog members={members} currentUserId={currentUserId} defaultPeriod={tab} />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Period)}>
        <TabsList>
          {PERIOD_TABS.map((p) => {
            const count = tasksByPeriod[p.value].filter((t) => t.status === "TODO").length;
            return (
              <TabsTrigger key={p.value} value={p.value} className="flex items-center gap-2">
                {p.label}
                {count > 0 && (
                  <Badge variant={tab === p.value ? "primary" : "neutral"} className="px-1.5">
                    {count}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {PERIOD_TABS.map((p) => (
          <TabsContent key={p.value} value={p.value}>
            <TaskList
              tasks={tasksByPeriod[p.value]}
              members={members}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              emptyMessage={`Nessuna task ${p.label.toLowerCase()}. Aggiungine una per iniziare.`}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
