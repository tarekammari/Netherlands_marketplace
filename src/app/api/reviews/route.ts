/**
 * src/app/api/reviews/route.ts
 *
 * POST /api/reviews — Submit a review after task completion.
 * Reviews are bidirectional: student reviews enterprise, enterprise reviews student.
 * Anti-gaming: payment must be RELEASED before a review is unlocked.
 */

// import { type NextRequest } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/guards";
import { db } from "@/lib/db";
import { created, badRequest, conflict, serverError } from "@/lib/api-response";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

const reviewSchema = z.object({
  taskId: z.string().uuid(),
  reviewedId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(20, "Please write at least 20 characters").max(2000).trim(),
});

export const POST = withAuth(async (request, { session }) => {
  const rl = await rateLimit("api", request);
  if (!rl.success) return rateLimitResponse(rl);

  try {
    const body = await request.json() as unknown;
    const data = reviewSchema.parse(body);

    // Anti-gaming: check payment is released for this task
    const payment = await db.payment.findFirst({
      where: { taskId: data.taskId, status: "RELEASED" },
    });
    if (!payment) {
      return badRequest("Reviews can only be submitted after the payment has been released.");
    }

    // Verify reviewer is a participant
    const isStudent = payment.studentId === session.user.id;
    const isEnterprise = payment.enterpriseId === session.user.id;
    if (!isStudent && !isEnterprise) {
      return badRequest("You are not a participant in this task.");
    }

    // Check for duplicate review
    const existing = await db.review.findUnique({
      where: { taskId_reviewerId: { taskId: data.taskId, reviewerId: session.user.id } },
    });
    if (existing) return conflict("You have already submitted a review for this task.");

    const review = await db.$transaction(async (tx) => {
      const r = await tx.review.create({
        data: {
          taskId: data.taskId,
          reviewerId: session.user.id,
          reviewedId: data.reviewedId,
          rating: data.rating,
          comment: data.comment,
        },
      });

      // Recalculate aggregate rating
      const agg = await tx.review.aggregate({
        where: { reviewedId: data.reviewedId },
        _avg: { rating: true },
        _count: { rating: true },
      });

      const avgRating = agg._avg.rating ?? 0;
      const totalReviewCount = agg._count.rating;

      // Update the reviewed user's profile
      const reviewed = await tx.user.findUnique({
        where: { id: data.reviewedId },
        select: { role: true },
      });

      if (reviewed?.role === "STUDENT") {
        await tx.studentProfile.update({
          where: { userId: data.reviewedId },
          data: { avgRating, totalReviewCount },
        });
      } else if (reviewed?.role === "ENTERPRISE") {
        await tx.enterpriseProfile.update({
          where: { userId: data.reviewedId },
          data: { avgRating, totalReviewCount },
        });
      }

      return r;
    });

    // In-app notification for the reviewed user
    await db.notification.create({
      data: {
        userId: data.reviewedId,
        type: "REVIEW_RECEIVED",
        title: `You received a ${data.rating}★ review`,
        body: data.comment.slice(0, 100),
        actionUrl: `/tasks/${data.taskId}`,
      },
    });

    return created(review);
  } catch (error) {
    return serverError(error, "POST /api/reviews");
  }
});
