/**
 * src/app/api/auth/verify-dev/route.ts
 *
 * GET /api/auth/verify-dev
 * Dev-only helper endpoint to verify all registered accounts.
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

export async function GET() {
  if (env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not allowed in production" }, { status: 403 });
  }

  try {
    const updated = await db.user.updateMany({
      where: { emailVerified: null },
      data:  { emailVerified: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully verified ${updated.count} accounts.`,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not allowed in production" }, { status: 403 });
  }

  try {
    const body = await request.json() as any;
    const { action, taskId } = body;

    if (action === "escrow_held" && taskId) {
      await db.payment.updateMany({
        where: { taskId },
        data: { status: "HELD", capturedAt: new Date() },
      });
      await db.task.update({
        where: { id: taskId },
        data: { status: "IN_PROGRESS" },
      });
      return NextResponse.json({ success: true, message: "Escrow state updated successfully (dev mock)." });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
