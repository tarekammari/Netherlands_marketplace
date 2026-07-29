/**
 * src/app/api/ai/chat/route.ts
 *
 * POST /api/ai/chat
 * Receives a user message and returns a TBAI response.
 * Persists conversation to AIChatSession/AIChatMessage tables.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { processMessage } from "@/lib/ai/engine";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting — 100 messages per minute per IP
    const rl = await rateLimit("api", req);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many messages. Please wait a moment." },
        { status: 429 }
      );
    }

    // 2. Parse request
    const body = await req.json() as {
      message:   string;
      sessionId?: string;
    };

    if (!body.message?.trim()) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }
    if (body.message.length > 1000) {
      return NextResponse.json({ error: "Message too long (max 1000 chars)." }, { status: 400 });
    }

    // 3. Resolve session / auth context
    const session  = await auth();
    const userId   = session?.user?.id;
    const userRole = session?.user?.role;
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "127.0.0.1";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prisma = db as any;

    // Get or create chat session
    let sessionId = body.sessionId;
    if (!sessionId) {
      const chatSession = await prisma.aiChatSession.create({
        data: {
          userId,
          context: { role: userRole, ip },
        },
      });
      sessionId = chatSession.id;
    }

    // 4. Store the user message
    await prisma.aiChatMessage.create({
      data: {
        sessionId,
        role:    "USER",
        content: body.message,
      },
    });

    // 5. Process with TBAI engine
    const response = await processMessage(body.message, {
      userId,
      userRole,
      sessionId,
    });

    // 6. Store the assistant response
    await prisma.aiChatMessage.create({
      data: {
        sessionId,
        role:     "ASSISTANT",
        content:  response.text,
        intent:   response.intent,
        metadata: {
          taskCards: response.taskCards,
          actions:   response.actions,
        },
      },
    });

    // 7. Return response
    return NextResponse.json({
      success: true,
      sessionId,
      response,
    });

  } catch (err) {
    console.error("[TBAI Chat]", err);
    return NextResponse.json(
      { error: "AI agent is temporarily unavailable. Please try again." },
      { status: 500 }
    );
  }
}

// ── GET: fetch session history ────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json({ messages: [] });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const messages = await (db as any).aiChatMessage.findMany({
    where:   { sessionId },
    orderBy: { createdAt: "asc" },
    take:    50,
  });

  return NextResponse.json({ messages });
}
