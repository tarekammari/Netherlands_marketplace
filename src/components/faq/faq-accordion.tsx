"use client";

/**
 * src/components/faq/faq-accordion.tsx
 *
 * Interactive FAQ Accordion & Category Filter Component.
 * Allows filtering by category and toggling answer drawers.
 */

import { useState } from "react";
import { ChevronDown, ChevronUp, Search, HelpCircle } from "lucide-react";

export interface FAQItem {
  id: string;
  category: "ALL" | "ENTERPRISE" | "STUDENT" | "PAYMENTS" | "LEGAL";
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: "faq-1",
    category: "PAYMENTS",
    question: "How does Stripe Escrow protect enterprise budgets and student earnings?",
    answer:
      "When an enterprise approves a task brief, 100% of the milestone funds are pre-authorized and captured into a secure Stripe Escrow Vault. Funds remain locked until the student submits deliverable files and the enterprise signs off on milestone completion.",
  },
  {
    id: "faq-2",
    category: "LEGAL",
    question: "What Dutch legal contract governs deliverables and intellectual property (IP)?",
    answer:
      "Every assigned task automatically generates a Dutch-law compliant Freelance & IP Assignment Agreement PDF. Upon digital signature, 100% of IP rights and commercial usage rights transfer to the enterprise upon milestone payment release.",
  },
  {
    id: "faq-3",
    category: "STUDENT",
    question: "How are student academic profiles and university domain emails verified?",
    answer:
      "Students must sign up using an official Dutch university domain email (e.g. @student.tudelft.nl, @uva.nl, @student.tue.nl, @eur.nl). Domain checks and manual KYC verification guarantee that only active students can apply.",
  },
  {
    id: "faq-4",
    category: "ENTERPRISE",
    question: "What is the 10% platform fee and who pays it?",
    answer:
      "TaskBridge NL charges a transparent flat 10% platform fee on funded task budgets. The enterprise pays the net 10% commission fee at payment capture, and the student receives 90% net payout without any deduction.",
  },
  {
    id: "faq-5",
    category: "PAYMENTS",
    question: "How quickly are SEPA Express payouts transferred to Dutch student bank accounts?",
    answer:
      "Once an enterprise approves a deliverable milestone, Stripe Connect triggers an instant SEPA Express transfer. Funds arrive directly into the student's IBAN bank account within minutes.",
  },
  {
    id: "faq-6",
    category: "ENTERPRISE",
    question: "What happens if an enterprise does not review milestone deliverables within 7 days?",
    answer:
      "To protect student talent, TaskBridge NL implements an automated 7-day safety auto-release timer. If a student submits final deliverables and the enterprise takes no action within 7 days, funds are automatically released to the student.",
  },
  {
    id: "faq-7",
    category: "LEGAL",
    question: "Are official tax invoices provided for Dutch Chamber of Commerce (KVK) accounting?",
    answer:
      "Yes. Every completed transaction generates a VAT-compliant Dutch tax invoice formatted with KVK numbers and BTW tax line items for easy corporate accounting.",
  },
  {
    id: "faq-8",
    category: "STUDENT",
    question: "Can international university students in the Netherlands work on tasks?",
    answer:
      "Yes! Enrolled international students at accredited Dutch universities with a valid BSN and Dutch or EU IBAN account are fully eligible to perform tasks under Dutch freelance guidelines.",
  },
];

export function FAQAccordion() {
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [openIds, setOpenIds] = useState<Set<string>>(new Set(["faq-1", "faq-2"]));

  const toggleFAQ = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredFAQs = FAQ_DATA.filter((item) => {
    const matchesCategory = activeCategory === "ALL" || item.category === activeCategory;
    const matchesSearch =
      searchQuery.trim() === "" ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8 font-sans">
      
      {/* Search & Category Filter Tabs */}
      <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 shadow-sm space-y-4 font-mono">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions by keyword (e.g., escrow, contract, KVK, payouts)..."
            className="w-full pl-11 pr-4 py-3 text-xs bg-[#fafafb] border border-neutral-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "ALL", label: "All Questions" },
            { id: "ENTERPRISE", label: "For Enterprises" },
            { id: "STUDENT", label: "For Students" },
            { id: "PAYMENTS", label: "Payments & Escrow" },
            { id: "LEGAL", label: "Legal & Contracts" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeCategory === tab.id
                  ? "bg-neutral-900 text-white shadow-sm font-black"
                  : "bg-[#fafafb] text-neutral-600 hover:bg-neutral-100 border border-neutral-200/80"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Accordion Item List */}
      <div className="space-y-4">
        {filteredFAQs.map((item) => {
          const isOpen = openIds.has(item.id);
          return (
            <div
              key={item.id}
              className="bg-white border border-neutral-200/80 rounded-2xl shadow-sm overflow-hidden transition-all"
            >
              <button
                onClick={() => toggleFAQ(item.id)}
                className="w-full p-6 text-left flex items-center justify-between gap-4 hover:bg-orange-50/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <HelpCircle className="h-5 w-5 text-orange-600 flex-shrink-0" />
                  <h3 className="text-base font-bold text-neutral-900 tracking-tight">
                    {item.question}
                  </h3>
                </div>
                <div className="p-1 rounded-lg text-neutral-400 bg-neutral-50 border border-neutral-200/60">
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isOpen && (
                <div className="px-6 pb-6 pt-2 border-t border-neutral-100 bg-[#fafafb]/50 text-xs sm:text-sm text-neutral-600 font-sans leading-relaxed animate-in fade-in duration-200">
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}

        {filteredFAQs.length === 0 && (
          <div className="bg-white p-12 rounded-2xl border border-neutral-200 text-center font-mono text-xs text-neutral-400">
            No matching questions found for "{searchQuery}".
          </div>
        )}
      </div>

    </div>
  );
}
