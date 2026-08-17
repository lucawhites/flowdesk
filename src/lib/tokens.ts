import "server-only";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 ora

function hashToken(rawToken: string) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

/**
 * Crea un token di verifica monouso per un'email. Restituisce il valore
 * "in chiaro" da mettere nel link inviato via email: nel database viene
 * salvato solo il suo hash, mai il token stesso (come per le password).
 */
export async function createVerificationToken(email: string) {
  const rawToken = crypto.randomBytes(32).toString("hex");

  // Invalida eventuali link di verifica precedenti per la stessa email.
  await prisma.verificationToken.deleteMany({ where: { email } });

  await prisma.verificationToken.create({
    data: {
      email,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });

  return rawToken;
}

/**
 * Verifica un token ricevuto dal link nell'email. Se valido e non scaduto,
 * lo consuma (monouso) e restituisce l'email associata; altrimenti null.
 */
export async function consumeVerificationToken(rawToken: string): Promise<string | null> {
  const tokenHash = hashToken(rawToken);

  const record = await prisma.verificationToken.findUnique({ where: { tokenHash } });
  if (!record) return null;

  // Il token va sempre eliminato dopo il primo utilizzo, anche se scaduto.
  await prisma.verificationToken.delete({ where: { id: record.id } });

  if (record.expiresAt < new Date()) return null;

  return record.email;
}

export function getAppUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
