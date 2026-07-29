/**
 * src/app/api/health/route.ts
 *
 * GET /api/health
 * Health check endpoint for deployment monitoring (Render, Railway, etc.).
 * Checks database connectivity.
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json(
      { status: "ok", db: "connected", timestamp: new Date().toISOString() },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { status: "error", db: "disconnected" },
      { status: 503 }
    );
  }
}
