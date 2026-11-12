"use client";

import { useOptimistic, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { Pencil, Sparkles, StickyNote, Target, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { deleteDaily, toggleDaily } from "@/app/(app)/work-actions";
import { DailyDialog } from "@/components/daily-dialog";
import { ItemMenu } from "@/components/item-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { cardClick } from "@/lib/card-click";
import { formatISO } from "@/lib/dates";
import { isCarriedOver } from "@/lib/daily-helpers";
import { cn, initials } from "@/lib/utils";
import type { DailyItem, ObjectiveOption, Role, TeamMember } from "@/lib/types";

export function DailyRow({
  daily,
  members,
  objectives,
  currentUserId,
  currentUserRole,
  today,
  showAssignee = false,
  showDate = false,
  dragHandle,
}: {
  daily: DailyItem;
  members: TeamMember[];
  objectives: ObjectiveOption[];
  currentUserId: string;
  currentUserRole: Role;
  today: string;
  showAssignee?: boolean;
  showDate?: boolean;
  /** Maniglia per il riordino, fornita da SortableList. */
  dragHandle?: ReactNode;
}) {
  const [, startTransition] = useTransition();
  const [done, setOptimisticDone] = useOptimistic(daily.completedOn !== null);
  const [detailOpen, setDetailOpen] = useState(false);
  const carried = isCarriedOver(daily, today);
  const canManage =
    currentUserRole === "ADMIN" || daily.creatorId === currentUserId || daily.assignee.id === currentUserId;

  const toggle = (checked: boolean) =>
    startTransition(async () => {
      setOptimisticDone(checked);
      await toggleDaily(daily.id, checked);
    });

  const editDialog = (trigger: ReactNode) => (
    <DailyDialog
      members={members}
      objectives={objectives}
      currentUserId={currentUserId}
      today={today}
      daily={daily}
      trigger={trigger}
    />
  );

  return (
    <div
      onClick={cardClick(() => setDetailOpen(true))}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface p-3.5 transition-colors hover:border-primary/40",
        done && "opacity-60"
      )}
    >
      {dragHandle}
      <div className="pt-0.5">
        <Checkbox
          checked={done}
          aria-label={done ? "Segna come da fare" : "Segna come fatta"}
          onCheckedChange={(checked) => toggle(checked === true)}
        />
      </div>

      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => setDetailOpen(true)}
          className={cn(
            "cursor-pointer text-left text-sm font-medium text-foreground outline-none hover:underline focus-visible:underline",
            done && "line-through"
          )}
        >
          {daily.title}
        </button>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {daily.objective && (
            <Link href={`/obiettivi/${daily.objective.id}`} className="max-w-full rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Badge variant="primary" className="max-w-full hover:underline">
                <Target className="h-3 w-3 shrink-0" />
                <span className="truncate">
                  {daily.objective.projectName} · {daily.objective.title}
                </span>
              </Badge>
            </Link>
          )}
          {daily.step && <Badge className="max-w-full"><span className="truncate">Passo: {daily.step.title}</span></Badge>}
          {daily.byAgent && (
            <Badge title="Creata dall'agente pianificatore">
              <Sparkles className="h-3 w-3" /> Agente
            </Badge>
          )}
          {daily.notes && (
            <Badge title="Ha delle note">
              <StickyNote className="h-3 w-3" /> Note
            </Badge>
          )}
          {carried && !done && (
            <Badge variant="warning">
              <Undo2 className="h-3 w-3" />
              Riportata dal {formatISO(daily.date)}
            </Badge>
          )}
          {showDate && !carried && <Badge>{formatISO(daily.date, "EEE d MMM")}</Badge>}
          {showAssignee && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-2 py-0.5 text-xs text-muted-foreground">
              <Avatar className="h-4 w-4">
                <AvatarFallback className="text-[0.5625rem]">{initials(daily.assignee.name)}</AvatarFallback>
              </Avatar>
              {daily.assignee.name}
            </span>
          )}
        </div>
      </div>

      {canManage && (
        <ItemMenu>
          {editDialog(
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <Pencil className="h-4 w-4" /> Modifica
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="text-danger data-[highlighted]:bg-danger-soft"
            onSelect={() => {
              startTransition(async () => {
                await deleteDaily(daily.id);
                toast.success("Daily eliminata");
              });
            }}
          >
            <Trash2 className="h-4 w-4" /> Elimina
          </DropdownMenuItem>
        </ItemMenu>
      )}

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="pr-6">{daily.title}</DialogTitle>
            <DialogDescription>
              {done
                ? daily.completedOn
                  ? `Completata il ${formatISO(daily.completedOn, "d MMMM")}`
                  : "Completata"
                : carried
                  ? `Da fare · riportata dal ${formatISO(daily.date, "d MMMM")}`
                  : "Da fare"}
            </DialogDescription>
          </DialogHeader>

          <dl className="flex flex-col gap-3 text-sm">
            <DetailLine label="Giorno">{formatISO(daily.date, "EEEE d MMMM yyyy")}</DetailLine>
            <DetailLine label="Responsabile">{daily.assignee.name}</DetailLine>
            <DetailLine label="Obiettivo">
              {daily.objective ? (
                <Link href={`/obiettivi/${daily.objective.id}`} className="font-medium text-accent hover:underline">
                  {daily.objective.title}
                </Link>
              ) : (
                <span className="text-muted-foreground">Nessuno (daily libera)</span>
              )}
              {daily.objective && <span className="block text-xs text-muted-foreground">{daily.objective.projectName}</span>}
            </DetailLine>
            {daily.step && <DetailLine label="Passo">{daily.step.title}</DetailLine>}
            {daily.byAgent && <DetailLine label="Origine">Creata dall&apos;agente pianificatore</DetailLine>}
            <DetailLine label="Note">
              {daily.notes ? (
                <span className="whitespace-pre-wrap">{daily.notes}</span>
              ) : (
                <span className="text-muted-foreground">Nessuna nota</span>
              )}
            </DetailLine>
          </dl>

          <DialogFooter className="flex-wrap">
            {canManage &&
              editDialog(
                <Button type="button" variant="outline">
                  <Pencil className="h-4 w-4" /> Modifica
                </Button>
              )}
            <Button
              type="button"
              variant={done ? "outline" : "primary"}
              onClick={() => {
                toggle(!done);
                setDetailOpen(false);
              }}
            >
              {done ? "Riapri" : "Segna come fatta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailLine({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[6.5rem_1fr] gap-3">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-foreground">{children}</dd>
    </div>
  );
}
