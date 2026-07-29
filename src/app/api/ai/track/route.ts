/**
 * src/app/api/ai/track/route.ts
 *
 * POST /api/ai/track
 * Logs behavioral events (task views, page views, etc.) for TBAI learning.
 * Also triggers AI task vector recomputation when tasks are created.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { buildTaskVector } from "@/lib/ai/tfidf";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = db as any;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      eventType: string;
      payload:   Record<string, unknown>;
      sessionId?: string;
    };

    if (!body.eventType) {
      return NextResponse.json({ error: "eventType is required." }, { status: 400 });
    }

    const session = await auth();
    const userId  = session?.user?.id;

    // Store the event
    await prisma.aIEvent.create({
      data: {
        userId,
        eventType: body.eventType as never,
        payload:   body.payload ?? {},
        sessionId: body.sessionId,
      },
    });

    // When a task is viewed/created, refresh its TF-IDF vector
    if (
      ["TASK_VIEW", "TASK_APPLY"].includes(body.eventType) &&
      typeof body.payload.taskId === "string"
    ) {
      const task = await db.task.findUnique({
        where:  { id: body.payload.taskId },
        select: { title: true, description: true, skillsRequired: true },
      });
      if (task) {
        const { keywords, tfidfJson } = buildTaskVector(
          task.title,
          task.description ?? "",
          task.skillsRequired
        );
        await prisma.aITaskVector.upsert({
          where:  { taskId: body.payload.taskId },
          create: { taskId: body.payload.taskId, keywords, tfidfJson },
          update: { keywords, tfidfJson },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    // Non-critical — silently swallow errors
    console.error("[TBAI Track]", err);
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
