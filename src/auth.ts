import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { LoginSchema } from "@/lib/validation";

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
      const publicPaths = new Set(["/", "/login", "/register"]);
      const isPublicPath = publicPaths.has(pathname);

      if (isPublicPath) {
        if (isLoggedIn && pathname !== "/") {
          return Response.redirect(new URL("/dashboard", request.nextUrl));
        }
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
