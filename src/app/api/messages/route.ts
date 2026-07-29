/**
 * src/app/api/messages/route.ts
 *
 * GET  /api/messages?taskId= — Load message history for a task thread.
 * POST /api/messages          — Send a message in a task thread.
 *
 * Security:
 *  - Only task participants (student + enterprise) can read/write messages.
 *  - Message content is AES-256-GCM encrypted before storage.
 *  - Admin can read any thread for dispute resolution.
 */

import { z } from "zod";

import { db } from "@/lib/db";
import { withAuth } from "@/lib/guards";
import { ok, created, badRequest, forbidden, notFound, serverError } from "@/lib/api-response";
import { encrypt, decrypt } from "@/lib/crypto";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

// ── Schemas ───────────────────────────────────────────────────────────────────

const sendMessageSchema = z.object({
  taskId:   z.string().uuid(),
  content:  z.string().min(1).max(10_000).trim(),
  fileUrls: z.array(z.string().url()).max(5).default([]),
});

// ── Participant check helper ──────────────────────────────────────────────────

async function isTaskParticipant(
  taskId: string,
  userId: string,
  role: string
): Promise<boolean> {
  if (role === "ADMIN") return true;

  const task = await db.task.findUnique({
    where:   { id: taskId },
    select:  { enterpriseId: true, applications: { where: { studentId: userId } } },
  });
  if (!task) return false;

  return (
    task.enterpriseId === userId ||
    task.applications.length > 0
  );
}

// ── GET ───────────────────────────────────────────────────────────────────────

export const GET = withAuth(async (request, { session }) => {
  const taskId = request.nextUrl.searchParams.get("taskId");
  if (!taskId) return badRequest("taskId is required");

  const canAccess = await isTaskParticipant(taskId, session.user.id, session.user.role);
  if (!canAccess) return forbidden("You are not a participant in this task.");

  try {
    const messages = await db.message.findMany({
      where:   { taskId },
      include: {
        sender: {
          select: {
            id:         true,
            avatarUrl:  true,
            role:       true,
            studentProfile:    { select: { university: true } },
            enterpriseProfile: { select: { companyName: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
      take:    200, // Pagination TODO: cursor-based
    });

    // Decrypt message content before returning
    const decrypted = messages.map((msg) => ({
      ...msg,
      content: msg.isEncrypted ? decrypt(msg.content) : msg.content,
    }));

    // Mark messages as read
    await db.message.updateMany({
      where: { taskId, senderId: { not: session.user.id }, isRead: false },
      data:  { isRead: true, readAt: new Date() },
    });

    return ok(decrypted);
  } catch (error) {
    return serverError(error, "GET /api/messages");
  }
});

// ── POST ──────────────────────────────────────────────────────────────────────

export const POST = withAuth(async (request, { session }) => {
  const rl = await rateLimit("api", request);
  if (!rl.success) return rateLimitResponse(rl);

  try {
    const body = await request.json() as unknown;
    const data = sendMessageSchema.parse(body);

    const canAccess = await isTaskParticipant(data.taskId, session.user.id, session.user.role);
    if (!canAccess) return forbidden("You are not a participant in this task.");

    // Verify task exists
    const task = await db.task.findUnique({ where: { id: data.taskId }, select: { id: true } });
    if (!task) return notFound("Task");

    // Encrypt content before storage
    const encryptedContent = encrypt(data.content);

    const message = await db.message.create({
      data: {
        taskId:      data.taskId,
        senderId:    session.user.id,
        content:     encryptedContent,
        fileUrls:    data.fileUrls,
        isEncrypted: true,
        type:        "TEXT",
      },
      include: {
        sender: { select: { id: true, avatarUrl: true, role: true } },
      },
    });

    // Return decrypted content to the sender
    return created({ ...message, content: data.content });
  } catch (error) {
    return serverError(error, "POST /api/messages");
  }
});
