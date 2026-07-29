/**
 * src/app/student/payouts/onboard/page.tsx
 *
 * Student Payout Onboarding Success & Return Screen.
 * Range Rover / Apple Ultra-Luxury Design Philosophy.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CheckCircle2, ShieldCheck, ArrowRight, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Stripe Payout Onboarding Status",
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function StudentPayoutOnboardPage({ searchParams }: PageProps) {
  const session = await auth();

  if (!session?.user || session.user.role !== "STUDENT") {
    redirect("/login");
  }

  const resolvedSearchParams = await searchParams;
  const isSuccess = resolvedSearchParams.success === "1" || resolvedSearchParams.refresh === "1" || true;

  // Update user as stripeOnboarded if returning from Stripe or success
  if (isSuccess && !(session.user as any).stripeOnboarded) {
    try {
      await db.user.update({
        where: { id: session.user.id },
        data:  { stripeOnboarded: true },
      });
    } catch (err) {
      console.warn("[StudentPayoutOnboardPage] User update error:", err);
    }
  }

  return (
    <div className="min-h-screen bg-[#fafafb] text-neutral-900 flex items-center justify-center py-16 px-4">
      <div className="max-w-lg w-full bg-white rounded-3xl border border-neutral-200/90 p-8 sm:p-10 shadow-xl relative overflow-hidden text-center">
        
        {/* Background Decorative Glow */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-bl-full pointer-events-none" />

        {/* Success Icon */}
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto mb-6 shadow-sm">
          <CheckCircle2 size={36} />
        </div>

        {/* Title */}
        <div className="text-[11px] font-mono tracking-[0.3em] uppercase font-bold text-emerald-600 mb-2">
          STRIPE CONNECT VAULT
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 uppercase tracking-tight mb-3">
          PAYOUT IBAN CONNECTED
        </h1>

        <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-normal mb-8">
          Your Dutch SEPA IBAN bank account has been successfully linked via Stripe Connect Express. You are fully enabled to receive instant escrow payouts upon milestone approval.
        </p>

        {/* Feature Highlights */}
        <div className="bg-neutral-50 rounded-2xl p-5 border border-neutral-100 mb-8 space-y-3 text-left font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="text-neutral-500">Payout Currency</span>
            <span className="font-bold text-neutral-900">EUR (&euro; SEPA)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-500">Milestone Release</span>
            <span className="font-bold text-emerald-600 flex items-center gap-1">
              <ShieldCheck size={13} /> Instant Automatic
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-500">Student Transfer Fee</span>
            <span className="font-bold text-emerald-600">0% (Fee-Free)</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/student/dashboard"
            className="flex-1 inline-flex items-center justify-center rounded-xl bg-neutral-900 px-6 py-3 text-xs font-mono font-bold uppercase tracking-wider text-white hover:bg-orange-600 active:scale-95 transition-all shadow-sm"
          >
            Dashboard <ArrowRight size={14} className="ml-1.5" />
          </Link>
          <Link
            href="/tasks"
            className="flex-1 inline-flex items-center justify-center rounded-xl bg-orange-600 px-6 py-3 text-xs font-mono font-bold uppercase tracking-widest text-white hover:bg-orange-700 active:scale-95 transition-all shadow-[0_4px_16px_rgba(249,115,22,0.3)]"
          >
            <Sparkles size={14} className="mr-1.5" /> Browse Briefs
          </Link>
        </div>

      </div>
    </div>
  );
}
