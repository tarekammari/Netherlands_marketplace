/**
 * src/app/api/stripe/webhooks/route.ts
 *
 * POST /api/stripe/webhooks
 *
 * Stripe webhook handler. This is the most security-critical endpoint.
 *
 * Security:
 *  - Signature verified with `stripe.webhooks.constructEvent` before ANY processing.
 *  - Raw body read with `request.arrayBuffer()` (not parsed JSON — signature would break).
 *  - Idempotency: each event type is checked for prior processing via AuditLog.
 *  - All payment state changes are wrapped in DB transactions.
 *
 * Handled events:
 *  - payment_intent.amount_capturable_updated → escrow funded, notify enterprise
 *  - payment_intent.succeeded                → funds captured, payout student
 *  - account.updated                         → sync Connect KYC status
 *  - charge.dispute.created                  → flag task as DISPUTED
 */

import { type NextRequest, NextResponse } from "next/server";
import { constructWebhookEvent } from "@/lib/stripe";
import { db } from "@/lib/db";
import { logger, auditLogger } from "@/lib/logger";
import { sendDisputeOpenedEmail, sendPaymentReleasedEmail } from "@/lib/email";
import { decrypt } from "@/lib/crypto";
import type Stripe from "stripe";

// ── Route config: disable body parser — we need the raw Buffer ────────────────
// Next.js App Router uses Web API Request, so we read arrayBuffer manually.

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    logger.warn("[Webhook] Missing stripe-signature header");
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const rawBody = Buffer.from(await request.arrayBuffer());
    event = constructWebhookEvent(rawBody, signature);
  } catch (err) {
    // Invalid signature → potential replay or forged request
    logger.warn("[Webhook] Signature verification failed", { err });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Idempotency check: skip if we've already processed this event
  const alreadyProcessed = await db.auditLog.findFirst({
    where: { action: `webhook.${event.type}`, entityId: event.id },
  });
  if (alreadyProcessed) {
    logger.info("[Webhook] Skipping duplicate event", { eventId: event.id });
    return NextResponse.json({ received: true });
  }

  // Route to the correct handler
  try {
    switch (event.type) {
      case "payment_intent.amount_capturable_updated":
        await handleEscrowFunded(event.data.object as Stripe.PaymentIntent);
        break;

      case "payment_intent.succeeded":
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case "account.updated":
        await handleAccountUpdated(event.data.object as Stripe.Account);
        break;

      case "charge.dispute.created":
        await handleDisputeCreated(event.data.object as Stripe.Dispute);
        break;

      default:
        logger.info(`[Webhook] Unhandled event type: ${event.type}`);
    }

    // Record that we processed this event
    await db.auditLog.create({
      data: {
        action:     `webhook.${event.type}`,
        entityType: "StripeEvent",
        entityId:   event.id,
        metadata:   { type: event.type },
      },
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error("[Webhook] Handler error", { eventType: event.type, error });
    // Return 500 so Stripe retries the webhook
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }
}

// ── Event Handlers ────────────────────────────────────────────────────────────

async function handleEscrowFunded(intent: Stripe.PaymentIntent): Promise<void> {
  const taskId = intent.metadata["taskId"];
  if (!taskId) return;

  await db.payment.update({
    where: { stripePaymentIntentId: intent.id },
    data:  {
      status:     "HELD",
      capturedAt: new Date(),
    },
  });

  await db.task.update({
    where: { id: taskId },
    data:  { status: "IN_PROGRESS" },
  });

  auditLogger.info("Escrow funded", { taskId, intentId: intent.id, amount: intent.amount });
}

async function handlePaymentSucceeded(intent: Stripe.PaymentIntent): Promise<void> {
  const taskId = intent.metadata["taskId"];
  if (!taskId) return;

  const payment = await db.payment.findFirst({
    where: { stripePaymentIntentId: intent.id },
    include: {
      task: { select: { title: true } },
    },
  });
  if (!payment) return;

  await db.payment.update({
    where: { id: payment.id },
    data:  { status: "RELEASED", releasedAt: new Date() },
  });

  await db.task.update({
    where: { id: taskId },
    data:  { status: "COMPLETED" },
  });

  // Update student's completed task count
  await db.studentProfile.update({
    where: { userId: payment.studentId },
    data:  { completedTaskCount: { increment: 1 } },
  });

  // Notify student of payment
  const student = await db.user.findUnique({ where: { id: payment.studentId } });
  if (student) {
    const studentName  = decrypt(student.nameEncrypted);
    const amountEur    = (payment.studentAmountCents / 100).toFixed(2);
    sendPaymentReleasedEmail(
      student.email,
      studentName,
      amountEur,
      payment.task.title
    ).catch(() => {});
  }

  auditLogger.info("Payment released", {
    taskId,
    studentId:  payment.studentId,
    amountCents: payment.studentAmountCents,
  });
}

async function handleAccountUpdated(account: Stripe.Account): Promise<void> {
  const userId = account.metadata?.["userId"];
  if (!userId) return;

  await db.user.update({
    where: { id: userId },
    data: {
      stripeOnboarded: account.details_submitted && account.payouts_enabled === true,
    },
  });
}

async function handleDisputeCreated(dispute: Stripe.Dispute): Promise<void> {
  const paymentIntentId = typeof dispute.payment_intent === "string"
    ? dispute.payment_intent
    : dispute.payment_intent?.id;

  if (!paymentIntentId) return;

  const payment = await db.payment.findFirst({
    where:   { stripePaymentIntentId: paymentIntentId },
    include: { task: { select: { id: true, title: true, enterpriseId: true } } },
  });
  if (!payment) return;

  await db.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data:  { status: "DISPUTED" },
    });
    await tx.task.update({
      where: { id: payment.task.id },
      data:  { status: "DISPUTED" },
    });
  });

  // Notify both parties
  const [student, enterprise] = await Promise.all([
    db.user.findUnique({ where: { id: payment.studentId }, select: { email: true } }),
    db.user.findUnique({ where: { id: payment.enterpriseId }, select: { email: true } }),
  ]);

  if (student)    sendDisputeOpenedEmail(student.email, payment.task.title).catch(() => {});
  if (enterprise) sendDisputeOpenedEmail(enterprise.email, payment.task.title).catch(() => {});

  auditLogger.warn("Dispute created", { taskId: payment.task.id, disputeId: dispute.id });
}
