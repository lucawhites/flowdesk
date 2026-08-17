"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { LoginSchema, RegisterSchema } from "@/lib/validation";
import { createVerificationToken, getAppUrl } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/email";

export type AuthFormState = {
  errors?: Record<string, string[]>;
  message?: string;
  info?: string;
  code?: string;
} | undefined;

async function dispatchVerificationEmail(email: string) {
  const rawToken = await createVerificationToken(email);
  const verifyUrl = `${getAppUrl()}/verify?token=${rawToken}`;
  await sendVerificationEmail(email, verifyUrl);
}

export async function login(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
      redirectTo: "/home",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      const code = (error as AuthError & { code?: string }).code;
      if (code === "email_not_verified") {
        return {
          code: "email_not_verified",
          message: "Devi prima confermare la tua email prima di accedere. Controlla la posta (anche lo spam).",
        };
      }
      if (error.type === "CredentialsSignin") {
        return { message: "Email o password non corrette." };
      }
      return { message: "Non è stato possibile accedere. Riprova." };
    }
    // NEXT_REDIRECT: va rilanciato perché Next.js possa completare il redirect.
    throw error;
  }
}

export async function register(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = RegisterSchema.safeParse({
    name: formData.get("name"),
    company: formData.get("company"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const email = parsed.data.email.toLowerCase();
  const domain = email.split("@")[1];

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return { errors: { email: ["Esiste già un account con questa email."] } };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  const team = await prisma.team.findUnique({ where: { domain } });

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email,
      passwordHash,
      role: team ? "MEMBER" : "ADMIN",
      team: team
        ? { connect: { id: team.id } }
        : { create: { name: parsed.data.company, domain } },
    },
  });

  try {
    await dispatchVerificationEmail(email);
  } catch {
    return {
      message:
        "Account creato, ma l'invio dell'email di verifica non è riuscito. Riprova più tardi o contatta l'amministratore del team.",
    };
  }

  return {
    info: `Ti abbiamo inviato un'email a ${email}: clicca sul link per confermare l'indirizzo e attivare l'account.`,
  };
}

export async function resendVerificationEmail(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();

  if (!email) {
    return { message: "Inserisci la tua email nel campo qui sopra, poi riprova." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  // Risposta identica sia che l'utente esista o meno, per non rivelare quali email sono registrate.
  if (user && !user.emailVerified) {
    try {
      await dispatchVerificationEmail(email);
    } catch {
      return { message: "Invio non riuscito. Riprova più tardi." };
    }
  }

  return { info: "Se l'indirizzo corrisponde a un account in attesa di conferma, ti abbiamo inviato un nuovo link." };
}
