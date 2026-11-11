import { Sparkles, TriangleAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { dateColumnToISO, formatISO, isoToDateColumn, todayISO } from "@/lib/dates";

type Stalled = { objectiveId: string; title: string; reason: string; suggestion: string };

const KIND = { plan: "Pianificazione", review: "Revisione" } as Record<string, string>;
const STATUS = {
  ok: { label: "ok", variant: "success" },
  dry: { label: "prova", variant: "neutral" },
  skipped: { label: "saltata", variant: "neutral" },
  error: { label: "errore", variant: "danger" },
} as const;

/** Sezione "Agente pianificatore" della pagina KPI: ultima revisione, esecuzioni e costo del mese. */
export async function AgentPanel({ teamId }: { teamId: string }) {
  const monthStart = isoToDateColumn(todayISO().slice(0, 8) + "01");
  const [runs, review, month, members] = await Promise.all([
    prisma.agentRun.findMany({ where: { teamId }, orderBy: { startedAt: "desc" }, take: 6 }),
    prisma.agentRun.findFirst({ where: { teamId, kind: "review", status: "ok" }, orderBy: { startedAt: "desc" } }),
    prisma.agentRun.aggregate({ where: { teamId, day: { gte: monthStart } }, _sum: { costUsd: true } }),
    prisma.user.findMany({ where: { teamId }, select: { name: true, areas: true }, orderBy: { name: "asc" } }),
  ]);
  const stalled = ((review?.output as { stalled?: Stalled[] } | null)?.stalled ?? []) as Stalled[];

  return (
    <section className="mx-auto mt-8 flex max-w-5xl flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Sparkles className="h-4 w-4 text-accent" /> Agente pianificatore
        </h2>
        <span className="text-xs text-muted-foreground">
          Costo del mese: {(month._sum.costUsd ?? 0).toLocaleString("it-IT", { style: "currency", currency: "USD" })}
        </span>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-5">
          {review ? (
            <div>
              <p className="text-xs font-medium text-muted-foreground">Revisione del {formatISO(dateColumnToISO(review.day), "EEEE d MMMM")}</p>
              <p className="mt-1 text-sm text-foreground">{review.summary}</p>
              {stalled.length > 0 && (
                <ul className="mt-3 flex flex-col gap-2">
                  {stalled.map((s) => (
                    <li key={s.objectiveId} className="rounded-lg bg-warning-soft px-3 py-2 text-xs">
                      <p className="flex items-center gap-1.5 font-semibold text-warning">
                        <TriangleAlert className="h-3.5 w-3.5" /> Fermo: {s.title}
                      </p>
                      <p className="mt-0.5 text-foreground">{s.reason}</p>
                      <p className="mt-0.5 text-muted-foreground">Suggerimento: {s.suggestion}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nessuna revisione ancora: la prima arriva lunedì mattina.</p>
          )}

          <div className="border-t border-border pt-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Ultime esecuzioni</p>
            {runs.length === 0 ? (
              <p className="text-xs text-muted-foreground">Ancora nessuna.</p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {runs.map((r) => {
                  const status = STATUS[r.status as keyof typeof STATUS] ?? STATUS.skipped;
                  return (
                    <li key={r.id} className="flex items-start gap-2 text-xs">
                      <span className="w-16 shrink-0 text-muted-foreground">{formatISO(dateColumnToISO(r.day))}</span>
                      <span className="w-28 shrink-0 text-foreground">{KIND[r.kind] ?? r.kind}</span>
                      <Badge variant={status.variant} className="shrink-0">{status.label}</Badge>
                      <span className="min-w-0 flex-1 truncate text-muted-foreground" title={r.error ?? r.summary ?? ""}>
                        {r.error ?? r.summary}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="border-t border-border pt-3 text-xs text-muted-foreground">
            Aree:{" "}
            {members.map((m, i) => (
              <span key={m.name}>
                {i > 0 && " · "}
                <span className="text-foreground">{m.name.split(" ")[0]}</span> {m.areas.join(", ") || "—"}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
