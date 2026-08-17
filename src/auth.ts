import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { LoginSchema } from "@/lib/validation";

export class EmailNotVerifiedSignin extends CredentialsSignin {
  code = "email_not_verified";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (rawCredentials) => {
        const parsed = LoginSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;

        const email = parsed.data.email.toLowerCase();
        const user = await prisma.user.findUnique({
          where: { email },
          include: { team: true },
        });
        if (!user) return null;

        const passwordMatches = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!passwordMatches) return null;

        if (!user.emailVerified) {
          throw new EmailNotVerifiedSignin();
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          teamId: user.teamId,
          teamName: user.team.name,
        };
      },
    }),
  ],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;
      // Pagine riservate a chi non ha ancora effettuato l'accesso: un utente già
      // loggato viene rimandato alla dashboard invece di vederle.
      const guestOnlyPaths = new Set(["/login", "/register"]);
      // Pagine sempre raggiungibili, indipendentemente dallo stato di login
      // (es. un link di verifica email cliccato mentre si è già connessi).
      const alwaysPublicPaths = new Set(["/", "/verify"]);

      if (guestOnlyPaths.has(pathname)) {
        return isLoggedIn ? Response.redirect(new URL("/dashboard", request.nextUrl)) : true;
      }
      if (alwaysPublicPaths.has(pathname)) {
        return true;
      }

      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role as "ADMIN" | "MEMBER";
        token.teamId = user.teamId as string;
        token.teamName = user.teamName as string;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.teamId = token.teamId;
        session.user.teamName = token.teamName;
      }
      return session;
    },
  },
});
