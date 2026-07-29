/**
 * src/lib/db.ts
 *
 * Singleton Prisma client.
 * In development, the module is attached to `global` to prevent
 * hot-reload from opening too many DB connections.
 */

import { PrismaClient } from "@prisma/client";
import { env } from "./env";

// Extend global type so TypeScript knows about our singleton
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log:
      env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
    errorFormat: "pretty",
  });
}

export const db: PrismaClient =
  globalThis.__prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") {
  globalThis.__prisma = db;
}
