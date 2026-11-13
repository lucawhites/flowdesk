"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, Target } from "lucide-react";
import { reorderItems } from "@/app/(app)/work-actions";
import { EmptyState } from "@/components/empty-state";
import { ObjectiveCard } from "@/components/objective-card";
import { ObjectiveGrid } from "@/components/objective-grid";
import { SortableList } from "@/components/sortable-list";
import { ACTIVE_LIMIT, QUEUE_LOOKAHEAD } from "@/lib/objective-status";
import { cn } from "@/lib/utils";
import type { ObjectiveItem, ObjectiveOption, Role, TeamMember } from "@/lib/types";

type Shared = {
  members: TeamMember[];
  projects: { id: string; name: string }[];
  objectiveOptions: ObjectiveOption[];
  currentUserId: string;
  currentUserRole: Role;
  today: string;
};

/** "all" = tutto il team, altrimenti l'id della persona. */
export type PersonFilter = string;

/**
 * Obiettivi divisi per stato: consegne, routine, attivi (massimo 3 a persona),
 * coda in ordine di priorità, ombrelli, in pausa e raggiunti.
 */
export function ObjectivesBoard({
  objectives,
  initialPerson,
  ...shared
}: Shared & { objectives: ObjectiveItem[]; initialPerson: PersonFilter }) {
  const [person, setPerson] = useState<PersonFilter>(initialPerson);
  const mine = person === "all" ? objectives : objectives.filter((o) => o.assignee.id === person);

  const open = (o: ObjectiveItem) => !o.reached && o.status !== "PAUSED";
  const deliveries = mine.filter((o) => o.kind === "DELIVERY" && open(o));
  const routines = mine.filter((o) => o.kind === "ROUTINE" && o.status !== "PAUSED");
  const active = mine.filter((o) => o.kind === "STANDARD" && o.status === "ACTIVE" && !o.reached);
  const queue = mine.filter((o) => o.kind === "STANDARD" && o.status === "QUEUED" && !o.reached);
  const umbrellas = mine.filter((o) => o.kind === "UMBRELLA");
  const paused = mine.filter((o) => o.status === "PAUSED" && o.kind !== "UMBRELLA" && !o.reached);
  const reached = mine.filter((o) => o.reached && o.kind !== "UMBRELLA" && o.kind !== "ROUTINE");

  const single = person !== "all";
  const count = (id: string) => objectives.filter((o) => o.assignee.id === id && o.kind === "STANDARD" && o.status === "ACTIVE" && !o.reached).length;

  return (
    <div className="flex flex-col gap-7">
      <div role="tablist" aria-label="Persona" className="flex flex-wrap gap-2">
        {[...shared.members.map((m) => ({ id: m.id, label: m.name.split(" ")[0], extra: `${count(m.id)}/${ACTIVE_LIMIT}` })), { id: "all", label: "Tutto il team", extra: "" }].map(
          (p) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={person === p.id}
              onClick={() => setPerson(p.id)}
              className={cn(
                "min-h-9 cursor-pointer rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                person === p.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-surface text-foreground hover:border-primary/40"
              )}
            >
              {p.label}
              {p.extra && <span className="ml-1.5 text-xs opacity-70">{p.extra} attivi</span>}
            </button>
          )
        )}
      </div>

      {mine.length === 0 && <EmptyState icon={Target} message="Nessun obiettivo qui." />}

      {deliveries.length > 0 && (
        <Section title="Consegne di Produzione" hint="Posti riservati alla Produzione, fuori dal limite dei 3">
          <ObjectiveGrid objectives={deliveries} {...shared} />
        </Section>
      )}

      {routines.length > 0 && (
        <Section title="Routine" hint="L'agente crea le daily alla cadenza indicata">
          <ObjectiveGrid objectives={routines} {...shared} />
        </Section>
      )}

      {(active.length > 0 || single) && (
        <Section
          title="Attivi"
          badge={single ? `${active.length} su ${ACTIVE_LIMIT}` : undefined}
          hint="Qui l'agente pianifica la maggior parte delle daily"
        >
          {active.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-3.5 py-3 text-xs text-muted-foreground">
              Nessun obiettivo attivo: il primo della coda parte alla prossima pianificazione.
            </p>
          ) : (
            <ObjectiveGrid objectives={active} {...shared} />
          )}
        </Section>
      )}

      {queue.length > 0 && (
        <Section title="In coda" hint="L'ordine è la priorità: trascina per cambiarlo">
          <p className="rounded-xl border border-dashed border-border bg-surface px-3.5 py-2.5 text-xs leading-relaxed text-muted-foreground">
            Quando un attivo arriva al 100% parte il primo pronto della coda. L&apos;agente usa i posti rimasti liberi per
            preparare i primi {QUEUE_LOOKAHEAD} di ogni persona e segnala le scadenze vicine.
          </p>
          <SortableList
            items={queue}
            className="flex flex-col gap-3"
            onReorder={(ids) => reorderItems("objective", ids)}
            renderItem={(o, handle) => (
              <div className="flex items-start gap-2">
                <span className="mt-4 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-muted text-xs font-semibold text-foreground">
                  {queue.indexOf(o) + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <ObjectiveCard objective={o} dragHandle={handle} {...shared} />
                </div>
              </div>
            )}
          />
        </Section>
      )}

      {umbrellas.length > 0 && (
        <Section title="Ombrelli" hint="Si riempiono con gli obiettivi collegati, non generano daily">
          <ObjectiveGrid objectives={umbrellas} {...shared} />
        </Section>
      )}

      {paused.length > 0 && (
        <Section title="In pausa" hint="Fermi finché qualcuno non li riattiva o li rimette in coda">
          <ObjectiveGrid objectives={paused} {...shared} />
        </Section>
      )}

      {reached.length > 0 && (
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
            <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
            Raggiunti · {reached.length}
          </summary>
          <div className="mt-3">
            <ObjectiveGrid objectives={reached} {...shared} />
          </div>
        </details>
      )}
    </div>
  );
}

function Section({ title, hint, badge, children }: { title: string; hint: string; badge?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {badge && <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold text-foreground">{badge}</span>}
        <span className="text-xs text-muted-foreground">{hint}</span>
      </div>
      {children}
    </section>
  );
}
