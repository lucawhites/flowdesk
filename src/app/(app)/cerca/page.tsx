import Link from "next/link";
import { CalendarCheck2, ChevronRight, FolderKanban, Search, Target } from "lucide-react";
import { requireSessionUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { getTeamMembers, searchTeam, SEARCH_MIN_LENGTH } from "@/lib/queries";
import { formatISO, todayISO } from "@/lib/dates";
import { DailyRow } from "@/components/daily-item";
import { EmptyState } from "@/components/empty-state";
import { Highlight } from "@/components/highlight";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requireSessionUser();
  const q = ((await searchParams).q ?? "").trim().slice(0, 100);
  const searching = q.length >= SEARCH_MIN_LENGTH;

  const [results, members, objectiveRows] = await Promise.all([
    searchTeam(user.teamId, q),
    searching ? getTeamMembers(user.teamId) : [],
    searching
      ? prisma.objective.findMany({
          where: { teamId: user.teamId },
          select: { id: true, title: true, project: { select: { name: true } } },
          orderBy: { createdAt: "asc" },
        })
      : [],
  ]);
  const objectiveOptions = objectiveRows.map((o) => ({ id: o.id, title: o.title, projectName: o.project.name }));
  const total = results.projects.length + results.objectives.length + results.dailies.length;
  const today = todayISO();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Cerca</h1>
        <form action="/cerca" role="search" className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Una parola in daily, obiettivi o progetti"
              aria-label="Cerca"
              autoFocus={!searching}
              autoComplete="off"
              enterKeyHint="search"
              className="pl-9"
            />
          </div>
          <Button type="submit">Cerca</Button>
        </form>
        {searching && (
          <p className="text-sm text-muted-foreground">
            {total === 0 ? (
              <>Nessun risultato per «{q}».</>
            ) : (
              <>
                {total} risultat{total === 1 ? "o" : "i"} per «{q}»
              </>
            )}
          </p>
        )}
      </div>

      {!searching && (
        <EmptyState icon={Search} message={`Scrivi almeno ${SEARCH_MIN_LENGTH} lettere: cerco nei titoli, nelle descrizioni, nei passi e nelle note.`} />
      )}

      {results.projects.length > 0 && (
        <Section icon={FolderKanban} title="Progetti" count={results.projects.length}>
          {results.projects.map((p) => (
            <ResultLink key={p.id} href={`/progetti/${p.id}`}>
              <p className="font-medium text-foreground">
                <Highlight text={p.name} query={q} />
              </p>
              {p.description && (
                <p className="text-sm text-muted-foreground">
                  <Highlight text={p.description} query={q} snippet />
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {p._count.objectives} obiettiv{p._count.objectives === 1 ? "o" : "i"}
              </p>
            </ResultLink>
          ))}
        </Section>
      )}

      {results.objectives.length > 0 && (
        <Section icon={Target} title="Obiettivi" count={results.objectives.length}>
          {results.objectives.map((o) => (
            <ResultLink key={o.id} href={`/obiettivi/${o.id}`}>
              <p className="font-medium text-foreground">
                <Highlight text={o.title} query={q} />
              </p>
              {o.description && o.description.toLowerCase().includes(q.toLowerCase()) && (
                <p className="text-sm text-muted-foreground">
                  <Highlight text={o.description} query={q} snippet />
                </p>
              )}
              {o.steps.map((s) => (
                <p key={s.title} className="text-sm text-muted-foreground">
                  {s.completedAt ? "✓ " : ""}Passo: <Highlight text={s.title} query={q} />
                </p>
              ))}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <Badge>{o.project.name}</Badge>
                <Badge>{o.assignee.name}</Badge>
                {o.inFocus && <Badge variant="primary">Focus</Badge>}
                {o.dueDate && <Badge>Scadenza {formatISO(o.dueDate)}</Badge>}
              </div>
            </ResultLink>
          ))}
        </Section>
      )}

      {results.dailies.length > 0 && (
        <Section icon={CalendarCheck2} title="Daily" count={results.dailies.length}>
          {results.dailies.map((d) => (
            <DailyRow
              key={d.id}
              daily={d}
              members={members}
              objectives={objectiveOptions}
              currentUserId={user.id}
              currentUserRole={user.role}
              today={today}
              showAssignee
              showDate
            />
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  count,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <Icon className="h-4 w-4" /> {title} · {count}
      </h2>
      {children}
    </section>
  );
}

function ResultLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 transition-colors hover:bg-surface-muted"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1 break-words">{children}</div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
