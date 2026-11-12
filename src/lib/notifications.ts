import "server-only";
import { prisma } from "@/lib/prisma";
import { formatISO, todayISO } from "@/lib/dates";
import { dailiesForToday } from "@/lib/daily-helpers";
import { objectiveProgressFrom } from "@/lib/progress";
import { getTeamWork } from "@/lib/queries";
import { getAppUrl } from "@/lib/tokens";
import type { DailyItem } from "@/lib/types";
import {
  EMAIL_COLORS as C,
  button,
  emailLayout,
  esc,
  heading,
  note,
  paragraph,
  progressBar,
  sendEmails,
  subheading,
  type EmailMessage,
} from "@/lib/email";

/** Chi riceve le email: membri del team che hanno attivato l'account. */
async function recipients(teamId: string) {
  return prisma.user.findMany({
    where: { teamId, emailVerified: { not: null }, NOT: { passwordHash: "" } },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
}

const firstName = (name: string) => name.trim().split(/\s+/)[0] || name;

// ─── Obiettivo raggiunto ─────────────────────────────────────────────────────

/** Avanzamento attuale di un obiettivo, letto dal database. */
export async function objectiveReached(objectiveId: string) {
  const o = await prisma.objective.findUnique({
    where: { id: objectiveId },
    select: {
      steps: { select: { completedAt: true } },
      dailies: { select: { completedAt: true } },
    },
  });
  if (!o) return false;
  return objectiveProgressFrom(
    { done: o.steps.filter((s) => s.completedAt).length, total: o.steps.length },
    { done: o.dailies.filter((d) => d.completedAt).length, total: o.dailies.length },
  ).reached;
}

/**
 * Da chiamare dopo aver spuntato una daily o un passo, se prima l'obiettivo NON era
 * raggiunto: se ora lo è, avvisa tutto il team. Parte una volta sola per obiettivo
 * (reachedNotifiedAt), anche se poi qualcuno toglie e rimette la spunta.
 */
export async function notifyIfObjectiveReached(objectiveId: string, closedByUserId: string | null) {
  if (!(await objectiveReached(objectiveId))) return;

  // Segna l'invio prima di inviare: se due spunte arrivano insieme parte un'email sola.
  const claimed = await prisma.objective.updateMany({
    where: { id: objectiveId, reachedNotifiedAt: null },
    data: { reachedNotifiedAt: new Date() },
  });
  if (claimed.count === 0) return;

  const objective = await prisma.objective.findUnique({
    where: { id: objectiveId },
    select: {
      id: true,
      title: true,
      teamId: true,
      project: { select: { name: true } },
      assignee: { select: { name: true } },
      _count: { select: { steps: true, dailies: true } },
    },
  });
  if (!objective) return;
  const closedBy = closedByUserId
    ? await prisma.user.findUnique({ where: { id: closedByUserId }, select: { name: true } })
    : null;

  const url = `${getAppUrl()}/obiettivi/${objective.id}`;
  const title = esc(objective.title);
  const work =
    objective._count.steps > 0
      ? `Tutti i ${objective._count.steps} passi sono conclusi.`
      : `Tutte le ${objective._count.dailies} daily collegate sono completate.`;

  const html = emailLayout({
    preheader: `${objective.project.name}: ${objective.title} è al 100%.`,
    body: `
      <p style="margin:0 0 14px;"><span style="display:inline-block;background:${C.successSoft};color:${C.success};font-size:12px;font-weight:700;padding:4px 10px;border-radius:999px;">Obiettivo raggiunto</span></p>
      ${heading(title)}
      ${paragraph(`<span style="color:${C.mutedForeground};">${esc(objective.project.name)} · responsabile ${esc(objective.assignee.name)}</span>`)}
      ${progressBar(100)}
      <div style="height:16px;"></div>
      ${paragraph(`${work}${closedBy ? ` L'ultima spunta l'ha messa ${esc(firstName(closedBy.name))}.` : closedByUserId === null ? " L'ultimo passo l'ha segnato l'agente nella revisione del lunedì." : ""}`)}
      ${button("Apri l'obiettivo", url)}
    `,
  });

  const to = await recipients(objective.teamId);
  await sendEmails(to.map((r) => ({ to: r.email, subject: `Obiettivo raggiunto: ${objective.title}`, html })));
}

// ─── Riepilogo serale ────────────────────────────────────────────────────────

function dailyLine(d: DailyItem, done: boolean) {
  const mark = done
    ? `<span style="display:inline-block;width:16px;height:16px;border-radius:50%;background:${C.success};color:#fff;font-size:11px;line-height:16px;text-align:center;">&#10003;</span>`
    : `<span style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid ${C.mutedForeground};"></span>`;
  const context = d.objective ? `<br><span style="font-size:12px;color:${C.mutedForeground};">${esc(d.objective.projectName)} · ${esc(d.objective.title)}</span>` : "";
  return `<tr>
    <td width="26" valign="top" style="padding:7px 0;">${mark}</td>
    <td style="padding:6px 0;font-size:14px;line-height:1.45;color:${done ? C.mutedForeground : C.foreground};">${esc(d.title)}${context}</td>
  </tr>`;
}

function dailyTable(items: DailyItem[], done: boolean) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${items.map((d) => dailyLine(d, done)).join("")}</table>`;
}

/**
 * Costruisce le email del riepilogo serale per un team (una per persona).
 * Le daily "di oggi" sono quelle del giorno più quelle riportate dai giorni prima.
 */
export async function buildDigest(teamId: string): Promise<EmailMessage[]> {
  const today = todayISO();
  const { members, objectives, dailies } = await getTeamWork(teamId);
  const todays = dailiesForToday(dailies, today);
  const isDone = (d: DailyItem) => d.completedOn === today;

  // Riga del team: completate / totali di oggi per persona.
  const teamRows = members
    .map((m) => {
      const mine = todays.filter((d) => d.assignee.id === m.id);
      return { name: m.name, done: mine.filter(isDone).length, total: mine.length };
    })
    .filter((r) => r.total > 0);
  const teamTable = teamRows.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${teamRows
        .map(
          (r) => `<tr>
            <td style="padding:5px 0;font-size:14px;">${esc(r.name)}</td>
            <td align="right" style="padding:5px 0;font-size:14px;font-weight:600;color:${r.done === r.total ? C.success : C.foreground};">${r.done}/${r.total}</td>
          </tr>`,
        )
        .join("")}</table>`
    : paragraph(`<span style="color:${C.mutedForeground};">Nessuna daily in programma oggi.</span>`);

  // Obiettivi in focus, con quelli raggiunti in fondo.
  const focus = objectives
    .filter((o) => o.inFocus)
    .sort((a, b) => Number(a.reached) - Number(b.reached) || b.progress - a.progress);
  const focusList = focus.length
    ? focus
        .map(
          (o) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px;">
            <tr>
              <td style="font-size:14px;line-height:1.4;padding-bottom:5px;">${esc(o.title)}<br><span style="font-size:12px;color:${C.mutedForeground};">${esc(o.project.name)} · ${esc(firstName(o.assignee.name))}</span></td>
              <td align="right" valign="top" style="font-size:14px;font-weight:600;padding-left:12px;color:${o.reached ? C.success : C.foreground};">${o.progress}%</td>
            </tr>
            <tr><td colspan="2">${progressBar(o.progress)}</td></tr>
          </table>`,
        )
        .join("")
    : paragraph(`<span style="color:${C.mutedForeground};">Nessun obiettivo in focus.</span>`);

  const dayLabel = formatISO(today, "EEEE d MMMM");
  const appUrl = getAppUrl();
  const to = await recipients(teamId);

  return to.map((person) => {
    const mine = todays.filter((d) => d.assignee.id === person.id);
    const done = mine.filter(isDone);
    const open = mine.filter((d) => !isDone(d));

    let mineHtml: string;
    if (mine.length === 0) {
      mineHtml = paragraph(`<span style="color:${C.mutedForeground};">Oggi non avevi daily assegnate.</span>`);
    } else {
      mineHtml = "";
      if (done.length) mineHtml += dailyTable(done, true);
      if (open.length) {
        mineHtml += `<p style="margin:${done.length ? "14px" : "0"} 0 4px;font-size:13px;font-weight:600;color:${C.accent};">Ancora aperte · passano a domani</p>${dailyTable(open, false)}`;
      }
    }

    const summary =
      mine.length === 0
        ? "Ecco com'è andata oggi per il team."
        : open.length === 0
          ? `Hai chiuso tutte le ${mine.length} daily di oggi.`
          : `Hai completato ${done.length} daily su ${mine.length}.`;

    const html = emailLayout({
      preheader: summary,
      body: `
        <p style="margin:0 0 6px;font-size:13px;color:${C.mutedForeground};">Riepilogo di ${esc(dayLabel)}</p>
        ${heading(`Ciao ${esc(firstName(person.name))}`)}
        ${paragraph(summary)}
        ${subheading("Le tue daily")}
        ${mineHtml}
        ${subheading("Il team oggi")}
        ${teamTable}
        ${subheading("Obiettivi in focus")}
        ${focusList}
        ${button("Apri Flowdesk", `${appUrl}/daily`)}
        ${note("Ricevi questo riepilogo ogni giorno feriale in serata.")}
      `,
    });

    return { to: person.email, subject: `Riepilogo di ${dayLabel} — Flowdesk`, html };
  });
}

export async function sendDigest(teamId: string, onlyEmail?: string) {
  const messages = (await buildDigest(teamId)).filter((m) => !onlyEmail || m.to === onlyEmail);
  await sendEmails(messages);
  return messages.map((m) => m.to);
}
