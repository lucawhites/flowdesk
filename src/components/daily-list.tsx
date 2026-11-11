"use client";

import { reorderItems } from "@/app/(app)/work-actions";
import { DailyRow } from "@/components/daily-item";
import { SortableList } from "@/components/sortable-list";
import { sortDailies } from "@/lib/daily-helpers";
import type { DailyItem, ObjectiveOption, Role, TeamMember } from "@/lib/types";

/**
 * Le daily di una giornata: quelle da fare si riordinano trascinandole,
 * quelle completate restano in fondo.
 */
export function DailyList({
  dailies,
  ...rowProps
}: {
  dailies: DailyItem[];
  members: TeamMember[];
  objectives: ObjectiveOption[];
  currentUserId: string;
  currentUserRole: Role;
  today: string;
  showAssignee?: boolean;
  showDate?: boolean;
}) {
  const sorted = sortDailies(dailies);
  const open = sorted.filter((d) => d.completedOn === null);
  const done = sorted.filter((d) => d.completedOn !== null);

  return (
    <div className="flex flex-col gap-2">
      {open.length > 0 && (
        <SortableList
          items={open}
          className="flex flex-col gap-2"
          onReorder={(ids) => reorderItems("daily", ids)}
          renderItem={(d, handle) => <DailyRow daily={d} dragHandle={handle} {...rowProps} />}
        />
      )}
      {done.map((d) => (
        <DailyRow key={d.id} daily={d} {...rowProps} />
      ))}
    </div>
  );
}
