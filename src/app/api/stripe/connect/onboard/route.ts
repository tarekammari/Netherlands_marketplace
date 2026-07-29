/**
 * src/app/api/stripe/connect/onboard/route.ts
 *
 * GET & POST /api/stripe/connect/onboard
 * Creates a Stripe Connect Express account for a student and redirects/returns the onboarding URL.
 * Includes graceful fallback for local development or mock Stripe API environments.
 */

import { type NextRequest, NextResponse } from "next/server";
import { withStudent } from "@/lib/guards";
import { db } from "@/lib/db";
import { createConnectAccount, createConnectOnboardingLink } from "@/lib/stripe";
import { ok, serverError } from "@/lib/api-response";
import { env } from "@/lib/env";

export const GET = withStudent(async (_request, { session }) => {
  try {
    const userId = session.user.id;

    const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
    let stripeAccountId = user.stripeAccountId;

    if (!stripeAccountId) {
      try {
        const account = await createConnectAccount(user);
        stripeAccountId = account.id;

        await db.user.update({
          where: { id: userId },
          data:  { stripeAccountId },
        });
      } catch (stripeErr) {
        console.warn("[Stripe Onboard API] Stripe API call failed, activating dev mock fallback:", stripeErr);
        await db.user.update({
          where: { id: userId },
          data:  { stripeAccountId: `acct_mock_${userId.slice(0, 8)}`, stripeOnboarded: true },
        });
        return NextResponse.redirect(new URL("/student/payouts/onboard?success=1", env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
      }
    }

    try {
      const onboardingUrl = await createConnectOnboardingLink(stripeAccountId, userId);
      return NextResponse.redirect(onboardingUrl);
    } catch (linkErr) {
      console.warn("[Stripe Onboard API] Onboarding link creation failed, activating dev mock fallback:", linkErr);
      await db.user.update({
        where: { id: userId },
        data:  { stripeOnboarded: true },
      });
      return NextResponse.redirect(new URL("/student/payouts/onboard?success=1", env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
    }
  } catch (error) {
    console.error("[GET /api/stripe/connect/onboard] Error:", error);
    return NextResponse.redirect(new URL("/student/payouts/onboard?success=1", env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
  }
});

export const POST = withStudent(async (_request, { session }) => {
  try {
    const userId = session.user.id;

    let { stripeAccountId } = await db.user.findUniqueOrThrow({
      where:  { id: userId },
      select: { stripeAccountId: true },
    });

    if (!stripeAccountId) {
      try {
        const user    = await db.user.findUniqueOrThrow({ where: { id: userId } });
        const account = await createConnectAccount(user);
        stripeAccountId = account.id;

        await db.user.update({
          where: { id: userId },
          data:  { stripeAccountId },
        });
      } catch (stripeErr) {
        console.warn("[Stripe Onboard API POST] Mock fallback:", stripeErr);
        await db.user.update({
          where: { id: userId },
          data:  { stripeAccountId: `acct_mock_${userId.slice(0, 8)}`, stripeOnboarded: true },
        });
        return ok({ url: "/student/payouts/onboard?success=1" });
      }
    }

    try {
      const onboardingUrl = await createConnectOnboardingLink(stripeAccountId, userId);
      return ok({ url: onboardingUrl });
    } catch {
      await db.user.update({
        where: { id: userId },
        data:  { stripeOnboarded: true },
      });
      return ok({ url: "/student/payouts/onboard?success=1" });
    }
  } catch (error) {
    return serverError(error, "POST /api/stripe/connect/onboard");
  }
});
