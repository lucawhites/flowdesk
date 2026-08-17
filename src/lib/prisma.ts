import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";

// In sviluppo usiamo SQLite (file locale, zero configurazione).
// In produzione (Vercel + Neon/Supabase/altro Postgres) basta impostare
// DATABASE_URL su una connection string "postgres://...": vedi README.md.
const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";

function createAdapter() {
  if (databaseUrl.startsWith("file:")) {
    return new PrismaBetterSqlite3({ url: databaseUrl });
  }
  return new PrismaPg({ connectionString: databaseUrl });
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter: createAdapter() });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
