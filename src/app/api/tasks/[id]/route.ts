/**
 * src/app/api/tasks/[id]/route.ts
 *
 * GET    /api/tasks/:id — Public task detail (SSR).
 * PATCH  /api/tasks/:id — Update task (Enterprise owner only).
 * DELETE /api/tasks/:id — Cancel task (Enterprise owner only).
 */

import { type NextRequest } from "next/server";

import { db } from "@/lib/db";
import { withEnterprise } from "@/lib/guards";
import { requireTaskOwner } from "@/lib/guards";
import { ok, notFound, badRequest, serverError } from "@/lib/api-response";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const task = await db.task.findUnique({
      where: { id },
      include: {
        enterprise: {
          select: {
            id: true,
            enterpriseProfile: {
              select: {
                companyName: true,
                logoUrl:     true,
                industry:    true,
                avgRating:   true,
                totalReviewCount: true,
              },
            },
          },
        },
        milestones: { orderBy: { sortOrder: "asc" } },
        _count:     { select: { applications: true } },
      },
    });

    if (!task) return notFound("Task");

    // Increment view count asynchronously (fire and forget)
    void db.task.update({
      where: { id },
      data:  { viewCount: { increment: 1 } },
    }).catch(() => null);

    return ok({ task });
  } catch (error) {
    return serverError(error, "GET /api/tasks/:id");
  }
}

// ── PATCH ─────────────────────────────────────────────────────────────────────

export const PATCH = withEnterprise<{ id: string }>(async (request, { session, params }) => {
  const rl = await rateLimit("api", request);
  if (!rl.success) return rateLimitResponse(rl);

  if (!params?.id) return badRequest("Task ID is required");

  const { task, error } = await requireTaskOwner(params.id, session.user.id);
  if (error) return error;

  // Only draft tasks can be edited freely; published tasks have limited fields
  const body = await request.json() as Record<string, unknown>;

  const allowedFields = task!.status === "DRAFT"
    ? ["title", "description", "category", "skillsRequired", "budgetCents", "deadline", "deliverables"]
    : ["status"]; // Published tasks can only change status

  const updateData: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) updateData[field] = body[field];
  }

  try {
    const updated = await db.task.update({
      where: { id: params.id },
      data:  updateData,
    });
    return ok(updated);
  } catch (err) {
    return serverError(err, "PATCH /api/tasks/:id");
  }
});

// ── DELETE (Cancel) ───────────────────────────────────────────────────────────

export const DELETE = withEnterprise<{ id: string }>(async (_request, { session, params }) => {
  if (!params?.id) return badRequest("Task ID is required");

  const { task, error } = await requireTaskOwner(params.id, session.user.id);
  if (error) return error;

  // Can't cancel a task that's already in progress or completed
  if (["IN_PROGRESS", "COMPLETED"].includes(task!.status)) {
    return badRequest("Cannot cancel a task that is already in progress or completed.");
  }

  try {
    await db.task.update({
      where: { id: params.id },
      data:  { status: "CANCELLED" },
    });
    return ok({ message: "Task cancelled successfully." });
  } catch (err) {
    return serverError(err, "DELETE /api/tasks/:id");
  }
});
