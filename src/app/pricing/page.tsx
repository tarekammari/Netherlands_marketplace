/**
 * src/app/pricing/page.tsx
 *
 * Pricing Page — Production Level Marketplace Model.
 * Features enterprise plans, student 0% fee model, interactive pricing calculator,
 * and feature comparison table.
 */

import type { Metadata } from "next";
import { PricingCalculator } from "@/components/pricing/pricing-calculator";
import { AdminImageEditable } from "@/components/admin/admin-image-editable";
import Link from "next/link";
import { Check, Euro, Building2, GraduationCap, Lock, ShieldCheck, Zap } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Pricing — TaskBridge NL",
  description:
    "Transparent pricing for Dutch enterprises and university students. Free for students, 10% flat take-rate for enterprises with Stripe Escrow protection.",
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#fafafb] text-neutral-900 py-12 md:py-20 font-sans">
      <div className="max-w-6xl mx-auto px-4 md:px-8 space-y-16">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200/80 text-orange-600 font-mono text-[11px] font-bold tracking-widest uppercase shadow-sm">
            <Euro className="h-3.5 w-3.5" /> TRANSPARENT MARKETPLACE PRICING
          </div>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-neutral-900 leading-tight">
            SIMPLE, TRANSPARENT 10% FEE MODEL
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 font-mono leading-relaxed">
            No subscriptions. No hidden costs. Pay only when you assign a brief and fund the Stripe Escrow Vault.
          </p>
        </div>

        {/* 2 Plan Cards: Enterprises vs Students */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Card 1: Enterprise Client */}
          <div className="bg-white border-2 border-orange-500 rounded-3xl p-8 shadow-md relative overflow-hidden flex flex-col justify-between space-y-6 font-mono">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-lg uppercase">
                  For Enterprises
                </span>
                <span className="text-xs text-neutral-400">Pay-as-you-go</span>
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl font-black uppercase text-neutral-900">Task Brief Plan</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-neutral-900">10%</span>
                  <span className="text-xs text-neutral-500 font-sans">platform commission fee per brief</span>
                </div>
              </div>

              <p className="text-xs text-neutral-600 font-sans leading-relaxed">
                Post unlimited task briefs, review verified university talent, and secure your budget in Stripe Escrow.
              </p>

              <div className="space-y-3 pt-2 text-xs">
                {[
                  "Unlimited Task Brief Postings",
                  "Stripe Escrow Capital Security",
                  "Auto-generated Dutch Legal PDF Contract",
                  "KVK Tax Invoices for Corporate Accounting",
                  "7-Day Milestone Approval Safety Net",
                ].map((feat) => (
                  <div key={feat} className="flex items-center gap-2.5 text-neutral-800">
                    <Check className="h-4 w-4 text-orange-600 flex-shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-neutral-100">
              <Link
                href="/register?role=ENTERPRISE"
                className="w-full py-3.5 bg-orange-600 text-white font-bold uppercase tracking-wider rounded-xl hover:bg-orange-700 shadow-md transition-all text-center block text-xs"
              >
                Start Posting Briefs &rarr;
              </Link>
            </div>
          </div>

          {/* Card 2: Student Talent */}
          <div className="bg-white border border-neutral-200/80 rounded-3xl p-8 shadow-sm flex flex-col justify-between space-y-6 font-mono">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg uppercase">
                  For University Students
                </span>
                <span className="text-xs text-emerald-600 font-bold">100% Free</span>
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl font-black uppercase text-neutral-900">Academic Talent</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-emerald-600">€0</span>
                  <span className="text-xs text-neutral-500 font-sans">No application or membership fees</span>
                </div>
              </div>

              <p className="text-xs text-neutral-600 font-sans leading-relaxed">
                Apply to professional tasks from verified Dutch companies and receive 90% net milestone payouts directly to your bank account.
              </p>

              <div className="space-y-3 pt-2 text-xs">
                {[
                  "Keep 90% of your milestone rate",
                  "Guaranteed Escrow payment before work start",
                  "Instant SEPA Express IBAN payouts",
                  "Verified Dutch IP contract protection",
                  "Build real corporate portfolio credentials",
                ].map((feat) => (
                  <div key={feat} className="flex items-center gap-2.5 text-neutral-800">
                    <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-neutral-100">
              <Link
                href="/register?role=STUDENT"
                className="w-full py-3.5 bg-neutral-900 text-white font-bold uppercase tracking-wider rounded-xl hover:bg-neutral-800 transition-all text-center block text-xs"
              >
                Join as Student Talent &rarr;
              </Link>
            </div>
          </div>

        </div>

        {/* Interactive Escrow Calculator */}
        <PricingCalculator />

        {/* Financial Escrow Security Banner with Admin Device Photo Upload */}
        <AdminImageEditable
          settingKey="PRICING_HERO_IMAGE"
          defaultSrc="/api/pricing-image"
          alt="Stripe Escrow Capital Protection & Financial Vault"
          className="rounded-3xl overflow-hidden border border-neutral-200 shadow-xl aspect-[21/9] relative bg-neutral-900 group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/85 via-neutral-950/40 to-transparent flex items-center p-8 sm:p-12 pointer-events-none">
            <div className="text-white font-mono max-w-lg space-y-2">
              <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-orange-400" /> BANK-GRADE CAPITAL PROTECTION
              </span>
              <h3 className="text-xl sm:text-3xl font-black uppercase tracking-tight">
                STRIPE ESCROW FINANCIAL VAULT
              </h3>
              <p className="text-xs sm:text-sm text-neutral-300 font-sans leading-relaxed">
                Task funds are locked safely in escrow before work starts. Capital is only transferred to student bank accounts upon explicit milestone approval.
              </p>
            </div>
          </div>
        </AdminImageEditable>

      </div>
    </div>
  );
}
