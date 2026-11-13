import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { addDaysISO, isoToDateColumn, todayISO } from "@/lib/dates";
import { runPlan, runReview } from "@/lib/agent/run";
import { proposeDailyText } from "@/lib/agent/daily-text";

// Una chiamata a Claude può durare qualche decina di secondi.
export const maxDuration = 300;

/**
 * Chiamata ogni mattina feriale dal Cron di Vercel (vercel.json).
 * Lunedì: prima la revisione (fa avanzare i passi), poi la pianificazione.
 * Parametri: ?task=plan|review (solo uno), ?task=instructions (una tantum: istruzioni alle daily aperte che non le hanno), ?dry=1 (non salva le daily), ?force=1 (anche se già eseguita oggi o nel weekend), ?day=YYYY-MM-DD con force (pianifica in anticipo quel giorno).
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
  // ?day=YYYY-MM-DD (solo con force): pianifica in anticipo un giorno lavorativo dei prossimi 7,
  // es. il venerdì sera per il lunedì. Il cron di quel giorno troverà il lavoro già fatto.
  const day = params.get("day");
  const realToday = todayISO();
  if (day && (!force || !/^\d{4}-\d{2}-\d{2}$/.test(day) || day < realToday || day > addDaysISO(realToday, 7))) {
    return NextResponse.json({ error: "day: serve force=1 e una data tra oggi e 7 giorni" }, { status: 400 });
  }
  const today = day ?? realToday;
  const weekday = isoToDateColumn(today).getUTCDay(); // 0 domenica, 1 lunedì

  if (!force && (weekday === 0 || weekday === 6)) {
    return NextResponse.json({ skipped: "weekend", today });
  }

  if (only === "instructions") return NextResponse.json(await backfillInstructions());

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

/**
 * Scrive descrizione (se manca) e istruzioni per le daily aperte che non hanno istruzioni,
 * come il pulsante "Proponi istruzioni". Non tocca testi già scritti.
 */
async function backfillInstructions() {
  const dailies = await prisma.daily.findMany({
    where: { completedAt: null, instructions: null },
    select: { id: true, teamId: true, title: true, notes: true, description: true, assigneeId: true, objectiveId: true, stepId: true },
  });
  let done = 0;
  const errors: string[] = [];
  // Quattro alla volta: abbastanza veloce, senza saturare l'API.
  for (let i = 0; i < dailies.length; i += 4) {
    await Promise.all(
      dailies.slice(i, i + 4).map(async (d) => {
        try {
          const text = await proposeDailyText(d.teamId, d);
          await prisma.daily.updateMany({
            where: { id: d.id, instructions: null },
            data: { instructions: text.instructions || null, description: d.description ?? (text.description || null) },
          });
          done += 1;
        } catch (e) {
          errors.push(`${d.title}: ${String(e)}`);
        }
      }),
    );
  }
  return { found: dailies.length, done, errors };
}
