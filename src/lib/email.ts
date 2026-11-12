import "server-only";
import { Resend } from "resend";
import { getAppUrl } from "@/lib/tokens";

const FROM_ADDRESS = process.env.EMAIL_FROM || "Flowdesk <onboarding@resend.dev>";

export type EmailMessage = { to: string; subject: string; html: string };

// ─── Invio ───────────────────────────────────────────────────────────────────

/**
 * Invia una o più email (fino a 100 per chiamata, con l'invio multiplo di Resend).
 * Senza RESEND_API_KEY (sviluppo locale) le stampa in console invece di inviarle.
 */
export async function sendEmails(messages: EmailMessage[]) {
  if (messages.length === 0) return;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    for (const m of messages) console.log(`\n[dev] Email per ${m.to}: ${m.subject}\n`);
    return;
  }

  const resend = new Resend(apiKey);
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100).map((m) => ({ from: FROM_ADDRESS, ...m }));
    const { error } = chunk.length === 1 ? await resend.emails.send(chunk[0]) : await resend.batch.send(chunk);
    if (error) throw new Error(`Invio email fallito: ${error.message}`);
  }
}

export async function sendVerificationEmail(email: string, verifyUrl: string) {
  if (!process.env.RESEND_API_KEY) {
    // Così in locale il link si legge comunque dalla console.
    console.log(`\n[dev] Link di verifica per ${email}:\n${verifyUrl}\n`);
    return;
  }
  await sendEmails([
    {
      to: email,
      subject: "Conferma il tuo indirizzo email — Flowdesk",
      html: emailLayout({
        preheader: "Un clic per attivare il tuo accesso a Flowdesk.",
        body: `
          ${heading("Conferma il tuo indirizzo email")}
          ${paragraph("Per completare la registrazione al workspace del tuo team su Flowdesk, conferma che questo indirizzo email è tuo.")}
          ${button("Conferma email", verifyUrl)}
          ${note("Il link scade tra un'ora. Se non hai richiesto tu questa registrazione, puoi ignorare questa email.")}
        `,
      }),
    },
  ]);
}

// ─── Modello grafico (stile Elitter) ─────────────────────────────────────────
// Le email non leggono il CSS dell'app: colori e stili sono scritti in linea.
// Palette chiara di globals.css, accento arancio usato con misura.

export const EMAIL_COLORS = {
  background: "#f4f2eb",
  surface: "#faf9f5",
  muted: "#ebe8de",
  foreground: "#141413",
  mutedForeground: "#6f6d65",
  border: "#e0dcd0",
  accent: "#d97757",
  accentSoft: "#f5e2d9",
  success: "#627548",
  successSoft: "#e5eadb",
} as const;

const C = EMAIL_COLORS;
const FONT = "Manrope, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

/** Testo inserito dagli utenti (titoli, nomi): va sempre passato di qui. */
export function esc(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function emailLayout({ preheader, body }: { preheader: string; body: string }) {
  const appUrl = getAppUrl();
  return `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:${C.background};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.background};">
<tr><td align="center" style="padding:32px 16px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
    <tr><td style="padding:0 4px 16px;font-family:${FONT};font-size:15px;font-weight:700;color:${C.foreground};letter-spacing:-0.01em;">
      <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${C.accent};margin-right:8px;vertical-align:middle;"></span>Flowdesk
    </td></tr>
    <tr><td style="background:${C.surface};border:1px solid ${C.border};border-radius:16px;padding:28px 24px;font-family:${FONT};color:${C.foreground};">
      ${body}
    </td></tr>
    <tr><td style="padding:16px 4px;font-family:${FONT};font-size:12px;line-height:1.6;color:${C.mutedForeground};">
      Email automatica di Flowdesk · <a href="${appUrl}" style="color:${C.mutedForeground};">Apri l'app</a>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
}

export function heading(text: string) {
  return `<h1 style="margin:0 0 12px;font-size:21px;line-height:1.3;font-weight:700;letter-spacing:-0.01em;color:${C.foreground};">${text}</h1>`;
}

export function subheading(text: string) {
  return `<h2 style="margin:28px 0 10px;font-size:13px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:${C.mutedForeground};">${text}</h2>`;
}

export function paragraph(text: string) {
  return `<p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:${C.foreground};">${text}</p>`;
}

export function note(text: string) {
  return `<p style="margin:16px 0 0;font-size:12px;line-height:1.6;color:${C.mutedForeground};">${text}</p>`;
}

export function button(label: string, href: string) {
  return `<p style="margin:24px 0 8px;"><a href="${href}" style="display:inline-block;background:${C.accent};color:#ffffff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:600;font-size:14px;">${label}</a></p>`;
}

/** Barra di avanzamento 0-100 fatta con una tabella (regge anche Outlook). */
export function progressBar(percent: number) {
  const p = Math.max(0, Math.min(100, Math.round(percent)));
  const fill = p >= 100 ? C.success : C.accent;
  const cells =
    p === 0
      ? `<td style="background:${C.muted};height:6px;font-size:0;line-height:0;">&nbsp;</td>`
      : p === 100
        ? `<td style="background:${fill};height:6px;font-size:0;line-height:0;">&nbsp;</td>`
        : `<td width="${p}%" style="background:${fill};height:6px;font-size:0;line-height:0;">&nbsp;</td><td style="background:${C.muted};height:6px;font-size:0;line-height:0;">&nbsp;</td>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-radius:3px;overflow:hidden;"><tr>${cells}</tr></table>`;
}
