/**
 * src/app/api/milestones/[id]/approve/route.ts
 *
 * POST /api/milestones/:id/approve
 * Enterprise approves a student-submitted milestone, releasing payout.
 *
 * Flow:
 *  1. Verify enterprise owns the task.
 *  2. Mark milestone as APPROVED.
 *  3. If all milestones approved → capture the escrow PaymentIntent.
 *  4. Stripe webhook `payment_intent.succeeded` then transfers to student.
 */

import { type NextRequest } from "next/server";
import { withEnterprise } from "@/lib/guards";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { ok, notFound, badRequest, serverError } from "@/lib/api-response";
import { auditLogger } from "@/lib/logger";

type Params = { id: string };

export const POST = withEnterprise<Params>(async (_request, { session, params }) => {
  if (!params?.id) return badRequest("Milestone ID required");

  try {
    const milestone = await db.milestone.findUnique({
      where:   { id: params.id },
      include: {
        task: {
          include: {
            milestones: true,
            payment:    true,
          },
        },
      },
    });

    if (!milestone) return notFound("Milestone");

    // Verify enterprise owns the task
    if (milestone.task.enterpriseId !== session.user.id) {
      const { forbidden } = await import("@/lib/api-response");
      return forbidden();
    }

    if (milestone.status !== "SUBMITTED") {
      return badRequest("Milestone must be in SUBMITTED status to approve.");
    }

    if (!milestone.task.payment) {
      return badRequest("No payment found for this task. Please fund the escrow first.");
    }

    // Mark milestone approved
    await db.milestone.update({
      where: { id: params.id },
      data:  { status: "APPROVED", approvedAt: new Date() },
    });

    // Check if all milestones are now approved
    const allApproved = milestone.task.milestones
      .filter((m) => m.id !== params.id)  // exclude current (just approved)
      .every((m) => m.status === "APPROVED");

    if (allApproved) {
      // Capture escrow → this triggers the Stripe webhook → student gets paid
      await stripe.paymentIntents.capture(
        milestone.task.payment.stripePaymentIntentId,
        undefined,
        { idempotencyKey: `capture-${milestone.task.payment.id}` }
      );

      auditLogger.info("Escrow captured — all milestones approved", {
        taskId:    milestone.taskId,
        paymentId: milestone.task.payment.id,
      });
    }

    return ok({ approved: true, allMilestonesApproved: allApproved });
  } catch (error) {
    return serverError(error, "POST /api/milestones/:id/approve");
  }
});
