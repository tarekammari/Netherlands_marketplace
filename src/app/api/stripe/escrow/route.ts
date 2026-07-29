/**
 * src/app/api/stripe/escrow/route.ts
 *
 * POST /api/stripe/escrow
 * Enterprise funds escrow for a task with a confirmed student selection.
 *
 * Flow:
 *  1. Validate enterprise owns the task.
 *  2. Verify the task has a SELECTED student and a SIGNED contract.
 *  3. Create Stripe PaymentIntent (capture_method: manual = escrow).
 *  4. Store payment record in DB.
 *  5. Return client_secret for Stripe Elements on the frontend.
 */

import { type NextRequest } from "next/server";
import { withEnterprise } from "@/lib/guards";
import { db } from "@/lib/db";
import { createEscrowPaymentIntent, upsertStripeCustomer } from "@/lib/stripe";
import { ok, badRequest, notFound, serverError } from "@/lib/api-response";
import { z } from "zod";

const bodySchema = z.object({ taskId: z.string().uuid() });

export const POST = withEnterprise(async (request, { session }) => {
  try {
    const body = await request.json() as unknown;
    const { taskId } = bodySchema.parse(body);

    // Load task with selected application and student's Stripe account
    const task = await db.task.findUnique({
      where: { id: taskId },
      include: {
        applications: {
          where:   { status: "SELECTED" },
          include: { student: { select: { id: true, stripeAccountId: true, stripeOnboarded: true } } },
        },
        contract: { select: { status: true } },
        payment:  { select: { id: true } },
      },
    });

    if (!task) return notFound("Task");
    if (task.enterpriseId !== session.user.id) {
      const { forbidden } = await import("@/lib/api-response");
      return forbidden();
    }

    // Guards
    if (task.status !== "ASSIGNED") {
      return badRequest("Task must be in ASSIGNED status before funding escrow.");
    }

    const selectedApp = task.applications[0];
    if (!selectedApp) return badRequest("No student has been selected for this task.");

    if (!selectedApp.student.stripeOnboarded || !selectedApp.student.stripeAccountId) {
      return badRequest("The selected student has not completed their Stripe payout setup.");
    }

    if (task.contract?.status !== "SIGNED") {
      return badRequest("Both parties must sign the contract before funding escrow.");
    }

    if (task.payment) {
      return badRequest("Escrow has already been funded for this task.");
    }

    // Upsert Stripe customer for enterprise
    const enterprise = await db.user.findUniqueOrThrow({ where: { id: session.user.id } });
    const customerId = await upsertStripeCustomer(enterprise);

    if (!enterprise.stripeCustomerId) {
      await db.user.update({
        where: { id: session.user.id },
        data:  { stripeCustomerId: customerId },
      });
    }

    // Create PaymentIntent
    const escrow = await createEscrowPaymentIntent({
      task:                     { id: task.id, title: task.title, budgetCents: task.budgetCents },
      enterprise:               { id: session.user.id, stripeCustomerId: customerId },
      studentStripeAccountId:   selectedApp.student.stripeAccountId,
      idempotencyKey:           `escrow-${task.id}`,
    });

    // Store payment record
    await db.payment.create({
      data: {
        taskId:                task.id,
        studentId:             selectedApp.student.id,
        enterpriseId:          session.user.id,
        stripePaymentIntentId: escrow.paymentIntentId,
        totalAmountCents:      escrow.totalAmountCents,
        platformFeeCents:      escrow.platformFeeCents,
        studentAmountCents:    escrow.studentAmountCents,
        status:                "PENDING",
        // Auto-release safety net (7 days from now, updated when milestone approved)
        autoReleaseAt:         new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Return client_secret to enterprise frontend for Stripe Elements
    return ok({ clientSecret: escrow.clientSecret, amount: escrow.totalAmountCents });
  } catch (error) {
    return serverError(error, "POST /api/stripe/escrow");
  }
});
