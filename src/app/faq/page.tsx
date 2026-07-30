/**
 * src/app/faq/page.tsx
 *
 * FAQ Page — Production Level Knowledge Base.
 * Features full-text FAQ search, category filters, and interactive accordion drawers.
 */

import type { Metadata } from "next";
import { FAQAccordion } from "@/components/faq/faq-accordion";
import Link from "next/link";
import { HelpCircle, MessageSquare } from "lucide-react";

export const metadata: Metadata = {
  title: "Frequently Asked Questions — TaskBridge NL",
  description:
    "Find answers to common questions about Stripe Escrow, Dutch legal freelance contracts, student university verification, and SEPA payouts.",
};

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-[#fafafb] text-neutral-900 py-12 md:py-20 font-sans">
      <div className="max-w-4xl mx-auto px-4 md:px-8 space-y-12">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200/80 text-orange-600 font-mono text-[11px] font-bold tracking-widest uppercase shadow-sm">
            <HelpCircle className="h-3.5 w-3.5" /> KNOWLEDGE BASE & HELP CENTER
          </div>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-neutral-900 leading-tight">
            FREQUENTLY ASKED QUESTIONS
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 font-mono leading-relaxed">
            Everything you need to know about our marketplace, Stripe Escrow security, Dutch legal IP contracts, and university verification.
          </p>
        </div>

        {/* Interactive Accordion */}
        <FAQAccordion />

        {/* Support Banner */}
        <div className="bg-white border border-neutral-200/80 rounded-3xl p-8 text-center space-y-4 shadow-sm font-mono">
          <h3 className="text-lg font-black uppercase text-neutral-900">Still have unanswered questions?</h3>
          <p className="text-xs text-neutral-500 max-w-md mx-auto">
            Our Amsterdam support desk is available Monday to Friday to assist with custom enterprise SLAs or verification requests.
          </p>
          <div className="pt-2">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-orange-700 shadow-md transition-all"
            >
              <MessageSquare className="h-4 w-4" /> Contact Support Team &rarr;
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
