/**
 * src/app/api/ai/admin-report/route.ts
 *
 * GET /api/ai/admin-report
 * Returns compiled AI admin intelligence report + TBAI usage analytics.
 * Protected: ADMIN role only.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, getPrismaModel } from "@/lib/db";
import { adminReporter } from "@/lib/ai/admin-reporter";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Auth guard
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionModel = getPrismaModel("AIChatSession");
  const messageModel = getPrismaModel("AIChatMessage");
  const eventModel   = getPrismaModel("AIEvent");

  const [report, usageStats] = await Promise.allSettled([
    adminReporter.generateReport(),
    (async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const [
        totalSessions,
        totalMessages,
        fullAIModeMessages,
        intentGroups,
        dailyVolume,
        avgConfidence,
      ] = await Promise.all([
        // Total chat sessions
        sessionModel ? sessionModel.count().catch(() => 0) : Promise.resolve(0),

        // Total messages
        messageModel ? messageModel.count({ where: { role: "ASSISTANT" } }).catch(() => 0) : Promise.resolve(0),

        // Full AI Mode messages (last 7 days)
        messageModel ? messageModel.count({
          where: {
            role: "ASSISTANT",
            metadata: { path: ["fullAIMode"], equals: true },
            createdAt: { gte: sevenDaysAgo },
          },
        }).catch(() => 0) : Promise.resolve(0),

        // Intent distribution (last 7 days)
        messageModel ? messageModel.groupBy({
          by:      ["intent"],
          _count:  { id: true },
          where:   { role: "ASSISTANT", intent: { not: null }, createdAt: { gte: sevenDaysAgo } },
          orderBy: { _count: { id: "desc" } },
        }).catch(() => []) : Promise.resolve([]),

        // Daily message volume (last 7 days) - approximated via events
        eventModel ? eventModel.groupBy({
          by:      ["createdAt"],
          _count:  { id: true },
          where:   { eventType: "CHAT_MESSAGE", createdAt: { gte: sevenDaysAgo } },
        }).catch(() => []) : Promise.resolve([]),

        // Average response confidence from recent messages
        messageModel ? messageModel.findMany({
          where:  { role: "ASSISTANT", createdAt: { gte: sevenDaysAgo } },
          select: { metadata: true },
          take:   200,
        }).catch(() => []) : Promise.resolve([]),
      ]);

      // Calculate avg confidence from metadata
      let avgConf = 0;
      if (Array.isArray(avgConfidence) && avgConfidence.length > 0) {
        const confs = avgConfidence
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((m: any) => (m.metadata as any)?.confidence ?? null)
          .filter((c: number | null) => typeof c === "number") as number[];
        avgConf = confs.length > 0 ? confs.reduce((a, b) => a + b, 0) / confs.length : 0;
      }

      // Total messages in last 7 days
      const recentMessages = messageModel
        ? await messageModel.count({
            where: { role: "ASSISTANT", createdAt: { gte: sevenDaysAgo } },
          }).catch(() => 0)
        : 0;

      return {
        totalSessions,
        totalMessages,
        recentMessages,
        fullAIModeUsage:       fullAIModeMessages,
        fullAIModePercentage:  recentMessages > 0
          ? Math.round((fullAIModeMessages / recentMessages) * 100)
          : 0,
        intentDistribution:    Array.isArray(intentGroups)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ? intentGroups.map((g: any) => ({ intent: g.intent ?? "UNKNOWN", count: g._count.id }))
          : [],
        avgConfidenceScore:    Math.round(avgConf * 100),
        dailyEventVolume:      Array.isArray(dailyVolume) ? dailyVolume.length : 0,
        fallbackRate:          Array.isArray(intentGroups)
          ? (() => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const unknownGroup = intentGroups.find((g: any) => g.intent === "UNKNOWN");
              const total = Array.isArray(intentGroups)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ? intentGroups.reduce((s: number, g: any) => s + g._count.id, 0)
                : 1;
              return unknownGroup
                ? Math.round((unknownGroup._count.id / total) * 100)
                : 0;
            })()
          : 0,
      };
    })(),
  ]);

  return NextResponse.json({
    report:     report.status === "fulfilled"   ? report.value   : null,
    usageStats: usageStats.status === "fulfilled" ? usageStats.value : null,
    generatedAt: new Date().toISOString(),
  });
}
