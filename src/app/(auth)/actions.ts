"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { LoginSchema, RegisterSchema } from "@/lib/validation";

export type AuthFormState = {
  errors?: Record<string, string[]>;
  message?: string;
} | undefined;

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
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
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
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { message: "Account creato, ma l'accesso automatico non è riuscito. Prova ad accedere manualmente." };
    }
    throw error;
  }
}
