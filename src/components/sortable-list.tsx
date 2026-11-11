"use client";

import { useId, useState, useTransition, type ReactNode } from "react";
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Lista di card riordinabili trascinando la maniglia (su telefono: pressione
 * prolungata sulla maniglia). L'ordine nuovo si vede subito e viene salvato da onReorder.
 */
export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  renderItem,
  layout = "list",
  disabled = false,
  className,
}: {
  items: T[];
  onReorder: (ids: string[]) => Promise<void>;
  renderItem: (item: T, handle: ReactNode) => ReactNode;
  layout?: "list" | "grid";
  disabled?: boolean;
  className?: string;
}) {
  const dndId = useId();
  const [, startTransition] = useTransition();
  // Ordine provvisorio, valido finché il server non rimanda i dati aggiornati.
  const [pendingOrder, setPendingOrder] = useState<string[] | null>(null);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const ordered = pendingOrder
    ? [...items].sort((a, b) => rank(pendingOrder, a.id) - rank(pendingOrder, b.id))
    : items;
  const ids = ordered.map((i) => i.id);
  const sortable = !disabled && items.length > 1;

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    const next = arrayMove(ids, from, to);
    setPendingOrder(next);
    startTransition(async () => {
      await onReorder(next);
      setPendingOrder(null);
    });
  }

  return (
    <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={ids} strategy={layout === "grid" ? rectSortingStrategy : verticalListSortingStrategy}>
        <div className={className}>
          {ordered.map((item) => (
            <SortableItem key={item.id} id={item.id} sortable={sortable}>
              {(handle) => renderItem(item, handle)}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function rank(order: string[], id: string) {
  const index = order.indexOf(id);
  return index < 0 ? order.length : index;
}

function SortableItem({
  id,
  sortable,
  children,
}: {
  id: string;
  sortable: boolean;
  children: (handle: ReactNode) => ReactNode;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: !sortable,
  });

  const handle = sortable ? (
    <button
      type="button"
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      aria-label="Trascina per riordinare"
      title="Trascina per riordinare"
      className="-ml-1.5 flex h-7 w-5 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground/60 outline-none transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
    >
      <GripVertical className="h-4 w-4" />
    </button>
  ) : null;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn("min-w-0", isDragging && "relative z-10 opacity-90 [&>*]:shadow-lg")}
    >
      {children(handle)}
    </div>
  );
}
