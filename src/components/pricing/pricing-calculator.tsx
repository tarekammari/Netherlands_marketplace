"use client";

/**
 * src/components/pricing/pricing-calculator.tsx
 *
 * Interactive Escrow & Fee Calculator Component.
 * Allows enterprise clients to slide task budgets and view exact fee splits.
 */

import { useState } from "react";
import { centsToEur } from "@/lib/utils";
import { Calculator, Lock, CheckCircle2, Building2, GraduationCap } from "lucide-react";

export function PricingCalculator() {
  const [budgetEur, setBudgetEur] = useState<number>(1000);

  const grossCents = budgetEur * 100;
  const platformFeeCents = Math.round(grossCents * 0.1);
  const studentPayoutCents = grossCents - platformFeeCents;

  return (
    <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-10 shadow-sm space-y-8 font-mono">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-6">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-orange-600 flex items-center gap-1.5 mb-1">
            <Calculator className="h-4 w-4" /> INTERACTIVE ESCROW CALCULATOR
          </div>
          <h3 className="text-xl font-black uppercase text-neutral-900 tracking-tight">
            Calculate Task Budget & Fee Split
          </h3>
        </div>
        <span className="px-3 py-1 bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold rounded-lg uppercase">
          10% Flat Take-Rate
        </span>
      </div>

      {/* Slider Input */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-neutral-600 uppercase">Select Task Budget Amount:</label>
          <span className="text-2xl font-black text-neutral-900">€{budgetEur.toLocaleString("nl-NL")}</span>
        </div>

        <input
          type="range"
          min={250}
          max={10000}
          step={50}
          value={budgetEur}
          onChange={(e) => setBudgetEur(Number(e.target.value))}
          className="w-full h-3 bg-neutral-100 rounded-lg appearance-none cursor-pointer accent-orange-600"
        />

        <div className="flex items-center justify-between text-[10px] text-neutral-400">
          <span>€250 (Small Task)</span>
          <span>€5,000 (Medium Brief)</span>
          <span>€10,000 (Large Project)</span>
        </div>
      </div>

      {/* Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div className="p-5 rounded-2xl bg-[#fafafb] border border-neutral-200/80 space-y-1">
          <span className="text-[10px] font-bold text-neutral-400 uppercase">Gross Escrow Capital</span>
          <p className="text-2xl font-black text-neutral-900">{centsToEur(grossCents)}</p>
          <span className="text-[10px] text-neutral-500 block">Pre-authorized via Stripe</span>
        </div>

        <div className="p-5 rounded-2xl bg-orange-50/50 border border-orange-200/60 space-y-1">
          <span className="text-[10px] font-bold text-orange-600 uppercase flex items-center gap-1">
            <Building2 className="h-3 w-3" /> Platform Fee (10%)
          </span>
          <p className="text-2xl font-black text-orange-600">{centsToEur(platformFeeCents)}</p>
          <span className="text-[10px] text-orange-700 block">Covers Escrow, Legal PDF & KYC</span>
        </div>

        <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200/60 space-y-1">
          <span className="text-[10px] font-bold text-emerald-600 uppercase flex items-center gap-1">
            <GraduationCap className="h-3 w-3" /> Student Net Payout (90%)
          </span>
          <p className="text-2xl font-black text-emerald-600">{centsToEur(studentPayoutCents)}</p>
          <span className="text-[10px] text-emerald-700 block">Instant SEPA Express Transfer</span>
        </div>
      </div>
    </div>
  );
}
