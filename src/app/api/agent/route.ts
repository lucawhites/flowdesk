import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isoToDateColumn, todayISO } from "@/lib/dates";
import { runPlan, runReview } from "@/lib/agent/run";

// Una chiamata a Claude può durare qualche decina di secondi.
export const maxDuration = 300;

/**
 * Chiamata ogni mattina feriale dal Cron di Vercel (vercel.json).
 * Lunedì: prima la revisione (fa avanzare i passi), poi la pianificazione.
 * Parametri: ?task=plan|review (solo uno), ?dry=1 (non salva le daily), ?force=1 (anche se già eseguita oggi o nel weekend).
 * Protetta da CRON_SECRET: Vercel lo invia come "Authorization: Bearer ...".
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const dryRun = params.get("dry") === "1";
  const force = params.get("force") === "1";
  const only = params.get("task");
  const today = todayISO();
  const weekday = isoToDateColumn(today).getUTCDay(); // 0 domenica, 1 lunedì

  if (!force && (weekday === 0 || weekday === 6)) {
    return NextResponse.json({ skipped: "weekend", today });
  }

  const results = [];
  for (const team of await prisma.team.findMany({ select: { id: true, name: true } })) {
    const already = async (kind: string) =>
      !force && !!(await prisma.agentRun.findFirst({ where: { teamId: team.id, kind, status: "ok", day: isoToDateColumn(today) } }));

    if ((only === "review" || (!only && weekday === 1)) && !(await already("review"))) {
      results.push(await runReview(team.id, today, { dryRun }));
    }
    if ((only === "plan" || !only) && !(await already("plan"))) {
      results.push(await runPlan(team.id, today, { dryRun }));
    }
  }

  return NextResponse.json({
    today,
    runs: results.map((r) => ({ kind: r.kind, status: r.status, summary: r.summary, error: r.error, costUsd: r.costUsd, output: r.output })),
  });
}
