import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role?: "ADMIN" | "MEMBER";
    teamId?: string;
    teamName?: string;
  }

  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "MEMBER";
      teamId: string;
      teamName: string;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: "ADMIN" | "MEMBER";
    teamId: string;
    teamName: string;
  }
}
