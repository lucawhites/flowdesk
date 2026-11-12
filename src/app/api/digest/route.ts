import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isoToDateColumn, todayISO } from "@/lib/dates";
import { buildDigest, sendDigest } from "@/lib/notifications";

/**
 * Riepilogo serale: chiamato ogni sera feriale dal Cron di Vercel (vercel.json).
 * Parametri: ?preview=1 restituisce l'HTML della prima email senza inviare (con ?to=<email> sceglie la persona),
 * ?to=<email> invia solo a quella persona, ?force=1 anche nel weekend.
 * Protetta da CRON_SECRET: Vercel lo invia come "Authorization: Bearer ...".
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const to = params.get("to") ?? undefined;
  const today = todayISO();
  const teams = await prisma.team.findMany({ select: { id: true } });

  if (params.get("preview") === "1") {
    for (const team of teams) {
      const message = (await buildDigest(team.id)).find((m) => !to || m.to === to);
      if (message) return new NextResponse(message.html, { headers: { "content-type": "text/html; charset=utf-8" } });
    }
    return NextResponse.json({ error: "Nessun destinatario" }, { status: 404 });
  }

  const weekday = isoToDateColumn(today).getUTCDay();
  if (params.get("force") !== "1" && (weekday === 0 || weekday === 6)) {
    return NextResponse.json({ skipped: "weekend", today });
  }

  const sent: string[] = [];
  for (const team of teams) sent.push(...(await sendDigest(team.id, to)));
  return NextResponse.json({ today, sent });
}
