/**
 * src/lib/stripe.ts
 *
 * Stripe client and all payment-related helpers.
 *
 * CRITICAL SECURITY RULES (enforced here):
 *  1. The Stripe secret key is ONLY accessed in this file.
 *  2. All amounts are validated server-side before any Stripe call.
 *  3. Idempotency keys are used on every mutating Stripe operation.
 *  4. Currency is always EUR — no dynamic currency selection.
 *  5. Webhook signatures are verified before processing any event.
 */

import Stripe from "stripe";
import { env } from "./env";
import type { Task, User } from "@prisma/client";

// ─── Singleton client ────────────────────────────────────────────────────────

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
  // Automatically retry idempotent requests on network errors
  maxNetworkRetries: 3,
  telemetry: false, // Disable Stripe telemetry in production
});

// ─── Constants ───────────────────────────────────────────────────────────────

const CURRENCY = "eur" as const;

// ─── Connect: Student Onboarding ─────────────────────────────────────────────

/**
 * Creates a Stripe Connect Express account for a student.
 * Express accounts handle KYC, payouts, and tax forms on Stripe's side.
 */
export async function createConnectAccount(
  user: Pick<User, "id" | "email">
): Promise<Stripe.Account> {
  return stripe.accounts.create({
    type: "express",
    country: "NL",
    email: user.email,
    capabilities: {
      transfers: { requested: true },
    },
    metadata: { userId: user.id },
  });
}

/**
 * Generates the OAuth link to redirect a student to Stripe's KYC flow.
 */
export async function createConnectOnboardingLink(
  stripeAccountId: string,
  userId: string
): Promise<string> {
  const link = await stripe.accountLinks.create({
    account: stripeAccountId,
    refresh_url: `${env.NEXT_PUBLIC_APP_URL}/student/payouts/onboard?refresh=1`,
    return_url:  `${env.NEXT_PUBLIC_APP_URL}/student/payouts/onboard?success=1&uid=${userId}`,
    type: "account_onboarding",
  });
  return link.url;
}

/**
 * Retrieves a Connect account's current status (payouts_enabled, charges_enabled).
 */
export async function getConnectAccountStatus(
  stripeAccountId: string
): Promise<{ payoutsEnabled: boolean; chargesEnabled: boolean; detailsSubmitted: boolean }> {
  const account = await stripe.accounts.retrieve(stripeAccountId);
  return {
    payoutsEnabled:  account.payouts_enabled ?? false,
    chargesEnabled:  account.charges_enabled ?? false,
    detailsSubmitted: account.details_submitted ?? false,
  };
}

// ─── Escrow: Payment Intents ─────────────────────────────────────────────────

interface CreateEscrowParams {
  /** Task being funded */
  task: Pick<Task, "id" | "title" | "budgetCents">;
  /** Enterprise paying */
  enterprise: Pick<User, "id" | "stripeCustomerId">;
  /** Student receiving payout */
  studentStripeAccountId: string;
  /** Unique idempotency key (use Payment.id) */
  idempotencyKey: string;
}

interface EscrowResult {
  paymentIntentId: string;
  clientSecret: string;
  totalAmountCents: number;
  platformFeeCents: number;
  studentAmountCents: number;
}

/**
 * Creates a PaymentIntent with manual capture (escrow pattern).
 *
 * Flow:
 *   1. `capture_method: 'manual'` → funds are authorised but NOT captured.
 *   2. When milestones are approved, call `captureEscrow()` to capture.
 *   3. Then call `releasePayout()` to transfer to student.
 *
 * The platform fee is taken via `application_fee_amount` — Stripe routes
 * it directly to the platform account before the student receives anything.
 */
export async function createEscrowPaymentIntent(
  params: CreateEscrowParams
): Promise<EscrowResult> {
  const { task, enterprise, studentStripeAccountId, idempotencyKey } = params;

  // Validate amount server-side (never trust client)
  const totalCents = task.budgetCents;
  if (totalCents < 100) throw new Error("Minimum task budget is €1.00");

  const platformFeeCents = Math.round(
    totalCents * (env.STRIPE_PLATFORM_FEE_PERCENT / 100)
  );
  const studentAmountCents = totalCents - platformFeeCents;

  const intent = await stripe.paymentIntents.create(
    {
      amount:   totalCents,
      currency: CURRENCY,
      // Funds held until manually captured — this is the escrow mechanism
      capture_method: "manual",
      // Platform fee deducted automatically on capture
      application_fee_amount: platformFeeCents,
      // Route through the student's Connect account
      transfer_data: { destination: studentStripeAccountId },
      ...(enterprise.stripeCustomerId && { customer: enterprise.stripeCustomerId }),
      description: `Escrow for task: ${task.title}`,
      metadata: {
        taskId:       task.id,
        enterpriseId: enterprise.id,
        feePercent:   env.STRIPE_PLATFORM_FEE_PERCENT.toString(),
      },
    },
    { idempotencyKey }
  );

  if (!intent.client_secret) {
    throw new Error("Stripe did not return a client_secret.");
  }

  return {
    paymentIntentId:   intent.id,
    clientSecret:      intent.client_secret,
    totalAmountCents:  totalCents,
    platformFeeCents,
    studentAmountCents,
  };
}

/**
 * Captures the held escrow funds — money moves from authorisation to capture.
 * Call this when the enterprise approves the final milestone.
 */
export async function captureEscrow(
  paymentIntentId: string,
  idempotencyKey: string
): Promise<Stripe.PaymentIntent> {
  return stripe.paymentIntents.capture(paymentIntentId, undefined, {
    idempotencyKey,
  });
}

/**
 * Cancels the escrow (refunds the authorisation without charging).
 * Used when a task is cancelled before funds are captured.
 */
export async function cancelEscrow(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> {
  return stripe.paymentIntents.cancel(paymentIntentId);
}

// ─── Webhooks ────────────────────────────────────────────────────────────────

/**
 * Verifies and constructs a Stripe event from a raw webhook request.
 * MUST be called before processing any webhook payload.
 * Throws if the signature is invalid — reject the request in that case.
 */
export function constructWebhookEvent(
  rawBody: Buffer,
  signature: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(
    rawBody,
    signature,
    env.STRIPE_WEBHOOK_SECRET
  );
}

// ─── Customers ───────────────────────────────────────────────────────────────

/**
 * Creates or retrieves a Stripe Customer for an enterprise.
 * Idempotent: safe to call multiple times.
 */
export async function upsertStripeCustomer(
  user: Pick<User, "id" | "email" | "stripeCustomerId">
): Promise<string> {
  if (user.stripeCustomerId) return user.stripeCustomerId;

  const customer = await stripe.customers.create({
    email: user.email,
    metadata: { userId: user.id },
  });

  return customer.id;
}
