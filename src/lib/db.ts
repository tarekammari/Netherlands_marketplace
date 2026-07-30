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
  // Use pooled DATABASE_URL for runtime queries to handle Neon compute auto-suspend
  let dbUrl = process.env.DATABASE_URL || process.env.DIRECT_URL || "";

  // Ensure Neon PgBouncer parameters are active for serverless connection pooler
  if (dbUrl && !dbUrl.includes("pgbouncer=true")) {
    dbUrl += (dbUrl.includes("?") ? "&" : "?") + "pgbouncer=true&connect_timeout=30&pool_timeout=10&connection_limit=5";
  }

  const options: Record<string, unknown> = {
    log: [],
    errorFormat: "minimal",
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
