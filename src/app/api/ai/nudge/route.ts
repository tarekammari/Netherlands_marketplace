/**
 * src/app/api/ai/nudge/route.ts
 *
 * GET /api/ai/nudge
 * Cron-triggered proactive nudge endpoint.
 * Runs the ProactiveAgent nudge cycle and returns results.
 *
 * Protected by:
 *  1. CRON_SECRET header (for Vercel Cron jobs)
 *  2. OR ADMIN session (for manual testing)
 *
 * Vercel cron.json schedule: daily at 09:00 CET
 * { "path": "/api/ai/nudge", "schedule": "0 8 * * *" }
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ProactiveAgent } from "@/lib/ai/proactive-agent";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // allow up to 60s for batch processing

export async function GET(req: NextRequest) {
  // Auth: accept Vercel Cron secret header OR admin session
  const cronSecret = req.headers.get("x-cron-secret")
    ?? req.nextUrl.searchParams.get("secret");

  const isCronRequest = cronSecret && cronSecret === (env.CRON_SECRET ?? "tbai-cron-secret");

  if (!isCronRequest) {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Provide admin session or valid cron secret." }, { status: 401 });
    }
  }

  // Dry run mode: returns counts without writing notifications
  const dryRun = req.nextUrl.searchParams.get("dry_run") === "true";

  try {
    const result = await ProactiveAgent.runNudgeCycle(dryRun);

    return NextResponse.json({
      success: true,
      dryRun,
      result,
      executedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[TBAI Nudge] Cycle failed:", err);
    return NextResponse.json(
      { error: "Nudge cycle failed. Check server logs." },
      { status: 500 }
    );
  }
}
