import "server-only";
import { Resend } from "resend";

const FROM_ADDRESS = process.env.EMAIL_FROM || "Flowdesk <onboarding@resend.dev>";

export async function sendVerificationEmail(email: string, verifyUrl: string) {
  const apiKey = process.env.RESEND_API_KEY;

  // Senza una chiave configurata (tipicamente in sviluppo locale) stampiamo il
  // link in console invece di inviare una vera email, così si può comunque
  // testare il flusso senza un account Resend.
  if (!apiKey) {
    console.log(`\n[dev] Link di verifica per ${email}:\n${verifyUrl}\n`);
    return;
  }

  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: email,
    subject: "Conferma il tuo indirizzo email — Flowdesk",
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h1 style="font-size: 20px; color: #16171f;">Conferma il tuo indirizzo email</h1>
        <p style="color: #444; font-size: 14px; line-height: 1.6;">
          Per completare la registrazione al workspace del tuo team su Flowdesk, conferma che questo indirizzo email è tuo cliccando sul pulsante qui sotto.
        </p>
        <p style="margin: 32px 0;">
          <a href="${verifyUrl}" style="background: #5b5bf2; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
            Conferma email
          </a>
        </p>
        <p style="color: #888; font-size: 12px; line-height: 1.6;">
          Il link scade tra un'ora. Se non hai richiesto tu questa registrazione, puoi ignorare questa email.
        </p>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Invio email di verifica fallito: ${error.message}`);
  }
}
