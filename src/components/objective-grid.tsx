"use client";

import { reorderItems } from "@/app/(app)/work-actions";
import { ObjectiveCard } from "@/components/objective-card";
import { SortableList } from "@/components/sortable-list";
import type { ObjectiveItem, ObjectiveOption, Role, TeamMember } from "@/lib/types";

/** Griglia di obiettivi (di un progetto) riordinabili trascinandoli. */
export function ObjectiveGrid({
  objectives,
  ...cardProps
}: {
  objectives: ObjectiveItem[];
  members: TeamMember[];
  projects: { id: string; name: string }[];
  objectiveOptions: ObjectiveOption[];
  currentUserId: string;
  currentUserRole: Role;
  today: string;
}) {
  return (
    <SortableList
      items={objectives}
      layout="grid"
      className="grid grid-cols-1 gap-3 md:grid-cols-2"
      onReorder={(ids) => reorderItems("objective", ids)}
      renderItem={(o, handle) => <ObjectiveCard objective={o} dragHandle={handle} {...cardProps} />}
    />
  );
}
