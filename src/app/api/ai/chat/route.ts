/**
 * src/app/api/ai/chat/route.ts
 *
 * POST /api/ai/chat
 * Receives a user message and returns a TBAI v2 response.
 * Persists conversation to AIChatSession/AIChatMessage tables.
 * Supports fullAIMode flag for memory-backed personalized responses.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPrismaModel } from "@/lib/db";
import { processMessage, type ConversationMessage } from "@/lib/ai/engine";
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
      message:      string;
      sessionId?:   string;
      fullAIMode?:  boolean;  // Full AI Mode flag
      currentPage?: string;   // current page hint
    };

    if (!body.message?.trim()) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }
    if (body.message.length > 1000) {
      return NextResponse.json({ error: "Message too long (max 1000 chars)." }, { status: 400 });
    }

    // 3. Resolve session / auth context
    const startTime = Date.now();
    const session   = await auth();
    const userId    = session?.user?.id;
    const userRole  = session?.user?.role;
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "127.0.0.1";

    const sessionModel = getPrismaModel("AIChatSession");
    const messageModel = getPrismaModel("AIChatMessage");

    // Get or create chat session (resilient DB write)
    let sessionId = body.sessionId;
    if (!sessionId && sessionModel) {
      try {
        const chatSession = await sessionModel.create({
          data: {
            userId,
            context: {
              role:        userRole,
              ip,
              fullAIMode:  body.fullAIMode ?? false,
              currentPage: body.currentPage ?? null,
            },
          },
        });
        sessionId = chatSession.id;
      } catch (err) {
        console.warn("[TBAI Chat] Unable to persist chat session:", err);
      }
    }

    // 4. Load recent conversation history for contextual replies
    let history: ConversationMessage[] = [];
    if (sessionId && messageModel) {
      try {
        const priorMessages = await messageModel.findMany({
          where:   { sessionId },
          orderBy: { createdAt: "asc" },
          take:    20,
        });
        history = priorMessages.map((m: { role: string; content: string; intent?: string | null; metadata?: { intent?: string } | null }) => ({
          role:    m.role === "USER" ? "user" as const : "assistant" as const,
          content: m.content,
          intent:  m.intent ?? (m.metadata as { intent?: string } | null)?.intent ?? undefined,
        }));
      } catch (err) {
        console.warn("[TBAI Chat] Unable to load conversation history:", err);
      }
    }

    // 5. Store the user message (resilient DB write)
    if (sessionId && messageModel) {
      try {
        await messageModel.create({
          data: {
            sessionId,
            role:    "USER",
            content: body.message,
          },
        });
      } catch (err) {
        console.warn("[TBAI Chat] Unable to persist user message:", err);
      }
    }

    // 6. Process with TBAI v2 engine
    const response = await processMessage(body.message, {
      userId,
      userRole,
      sessionId,
      fullAIMode:  body.fullAIMode ?? false,
      currentPage: body.currentPage,
      history,
    });

    const responseMs = Date.now() - startTime;

    // 7. Store the assistant response (resilient DB write)
    if (sessionId && messageModel) {
      try {
        await messageModel.create({
          data: {
            sessionId,
            role:     "ASSISTANT",
            content:  response.text,
            intent:   response.intent,
            metadata: {
              taskCards:       response.taskCards,
              actions:         response.actions,
              agentActions:    response.agentActions,
              suggestedReplies: response.suggestedReplies,
              responseMs,
              fullAIMode:      body.fullAIMode ?? false,
              memoryUpdated:   response.memoryUpdated ?? false,
            },
          },
        });
      } catch (err) {
        console.warn("[TBAI Chat] Unable to persist assistant response:", err);
      }
    }

    // 8. Return response
    return NextResponse.json({
      success: true,
      sessionId: sessionId ?? "temp-session",
      response,
      meta: {
        responseMs,
        fullAIMode: body.fullAIMode ?? false,
      },
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

  const messageModel = getPrismaModel("AIChatMessage");
  if (!messageModel) return NextResponse.json({ messages: [] });

  try {
    const messages = await messageModel.findMany({
      where:   { sessionId },
      orderBy: { createdAt: "asc" },
      take:    50,
    });
    return NextResponse.json({ messages });
  } catch {
    return NextResponse.json({ messages: [] });
  }
}

