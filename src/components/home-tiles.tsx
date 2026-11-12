"use client";

import type { ReactNode } from "react";
import { saveHomeOrder } from "@/app/(app)/work-actions";
import { SortableList } from "@/components/sortable-list";

/** Gruppo di tessere della Home riordinabili trascinando la maniglia nell'angolo. */
export function HomeTiles({ tiles, className }: { tiles: { id: string; node: ReactNode }[]; className?: string }) {
  return (
    <SortableList
      items={tiles}
      layout="grid"
      className={className}
      onReorder={saveHomeOrder}
      renderItem={(tile, handle) => (
        <div className="relative grid h-full [&>a]:block">
          {tile.node}
          {handle && <span className="absolute right-0.5 top-1">{handle}</span>}
        </div>
      )}
    />
  );
}
