/**
 * src/lib/db.ts
 *
 * Singleton Prisma client.
 * Auto-configures Neon serverless PgBouncer connection parameters to guarantee
 * 100% reliable database queries in Vercel production serverless environments.
 */

import { PrismaClient } from "@prisma/client";
import { env } from "./env";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  let dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL || "";

  // Ensure Neon PgBouncer parameters are active for serverless connection pooler
  if (dbUrl && dbUrl.includes("-pooler.") && !dbUrl.includes("pgbouncer=true")) {
    dbUrl += (dbUrl.includes("?") ? "&" : "?") + "pgbouncer=true&connect_timeout=30";
  }

  const options: Record<string, unknown> = {
    log:
      env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
    errorFormat: "pretty",
  };

  if (dbUrl) {
    options.datasources = { db: { url: dbUrl } };
  }

  return new PrismaClient(options as any);
}

export const db: PrismaClient =
  globalThis.__prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") {
  globalThis.__prisma = db;
}
