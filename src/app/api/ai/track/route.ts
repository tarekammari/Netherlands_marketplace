/**
 * src/app/api/ai/track/route.ts
 *
 * POST /api/ai/track
 * Logs behavioral events (task views, page views, etc.) for TBAI learning.
 * Also triggers AI task vector recomputation when tasks are created.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, getPrismaModel } from "@/lib/db";
import { buildTaskVector } from "@/lib/ai/tfidf";

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
    const aiEventModel = getPrismaModel("AIEvent");
    if (aiEventModel) {
      await aiEventModel.create({
        data: {
          userId,
          eventType: body.eventType as never,
          payload:   body.payload ?? {},
          sessionId: body.sessionId,
        },
      }).catch(() => {});
    }

    // When a task is viewed/created, refresh its TF-IDF vector
    if (
      ["TASK_VIEW", "TASK_APPLY"].includes(body.eventType) &&
      typeof body.payload?.taskId === "string"
    ) {
      const task = await db.task.findUnique({
        where:  { id: body.payload.taskId as string },
        select: { title: true, description: true, skillsRequired: true },
      });
      if (task) {
        const { keywords, tfidfJson } = buildTaskVector(
          task.title,
          task.description ?? "",
          task.skillsRequired
        );
        const taskVectorModel = getPrismaModel("AITaskVector");
        if (taskVectorModel) {
          await taskVectorModel.upsert({
            where:  { taskId: body.payload.taskId as string },
            create: { taskId: body.payload.taskId as string, keywords, tfidfJson },
            update: { keywords, tfidfJson },
          }).catch(() => {});
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
