"use client";

import { useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteEvent } from "@/app/(app)/calendario/actions";
import { EventDialog } from "@/components/calendar/event-dialog";
import { ItemMenu } from "@/components/item-menu";
import { Badge } from "@/components/ui/badge";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { eventRangeLabel, eventTimeLabel } from "@/lib/calendar-helpers";
import { cn } from "@/lib/utils";
import type { CalendarEventItem, Role, TeamMember } from "@/lib/types";

export function EventRow({
  event,
  members,
  currentUserId,
  currentUserRole,
  compact = false,
}: {
  event: CalendarEventItem;
  members: TeamMember[];
  currentUserId: string;
  currentUserRole: Role;
  /** Versione stretta, per le colonne della vista settimanale. */
  compact?: boolean;
}) {
  const [, startTransition] = useTransition();
  const canManage =
    currentUserRole === "ADMIN" || event.creatorId === currentUserId || event.person?.id === currentUserId;
  const range = eventRangeLabel(event);
  // Nelle colonne strette della settimana: niente "Tutto il giorno" e solo il nome.
  const details = (
    compact
      ? [eventTimeLabel(event), range, event.person?.name.split(" ")[0] ?? "Tutto il team"]
      : [eventTimeLabel(event) ?? "Tutto il giorno", range, event.person?.name ?? "Tutto il team"]
  ).filter(Boolean);

  return (
    <div
      className={cn(
        "flex items-start rounded-2xl border border-border bg-surface shadow-sm",
        compact ? "gap-2 p-3 md:gap-1 md:rounded-xl md:p-2" : "gap-3 p-4"
      )}
    >
      <span
        aria-hidden
        className={cn(
          "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full",
          event.absence ? "bg-warning" : "bg-accent",
          compact && "md:hidden"
        )}
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className={cn("break-words font-medium text-foreground", compact ? "text-sm md:text-xs" : "text-sm")}>
            {event.title}
          </p>
          {event.absence && <Badge variant="warning">Assente</Badge>}
        </div>
        <p className={cn("mt-0.5 text-muted-foreground", compact ? "text-xs md:text-[0.6875rem]" : "text-xs")}>
          {details.join(" · ")}
        </p>
      </div>

      {canManage && (
        <ItemMenu>
          <EventDialog
            members={members}
            currentUserId={currentUserId}
            event={event}
            defaultDate={event.startDate}
            trigger={
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Pencil className="h-4 w-4" /> Modifica
              </DropdownMenuItem>
            }
          />
          <DropdownMenuItem
            className="text-danger data-[highlighted]:bg-danger-soft"
            onSelect={() => {
              startTransition(async () => {
                await deleteEvent(event.id);
                toast.success("Evento eliminato");
              });
            }}
          >
            <Trash2 className="h-4 w-4" /> Elimina
          </DropdownMenuItem>
        </ItemMenu>
      )}
    </div>
  );
}
