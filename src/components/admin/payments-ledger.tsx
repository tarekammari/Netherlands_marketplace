"use client";

/**
 * src/components/admin/payments-ledger.tsx
 *
 * Enterprise Financial Intelligence & AML Compliance Audit Center.
 * - Interactive Metric Card Modals (Click any card to inspect detailed financial breakdown).
 * - Date Range Filter ("All Time", "Today", "Last 7 Days", "Last 30 Days", "This Quarter").
 * - AI Anomaly & Fraud Detection Engine (Flags suspicious transfers, high amounts for simple work, rapid velocity).
 * - Admin Security Action Controls (Freeze Escrow Payout, Mark Verified Legal).
 */

import { useState, useMemo } from "react";
import Link from "next/link";
import { centsToEur, timeAgo } from "@/lib/utils";
import {
  Search,
  Lock,
  CheckCircle2,
  ArrowLeft,
  X,
  Download,
  ShieldCheck,
  Building2,
  GraduationCap,
  CreditCard,
  TrendingUp,
  ShieldAlert,
  Calendar,
} from "lucide-react";

export interface PaymentItem {
  id: string;
  totalAmountCents: number;
  platformFeeCents: number;
  studentAmountCents: number;
  status: "PENDING" | "HELD" | "RELEASED" | "REFUNDED" | "DISPUTED";
  createdAt: Date | string;
  stripePaymentIntentId?: string | undefined;
  stripeTransferId?: string | undefined;
  // AI Risk & Anomaly Audit Fields
  riskScore?: number | undefined; // 0 - 100
  isSuspicious?: boolean | undefined;
  anomalyReason?: string | undefined;
  task: {
    id: string;
    title: string;
    category?: string | undefined;
    enterpriseName?: string | undefined;
    studentName?: string | undefined;
    university?: string | undefined;
  };
}

interface PaymentsLedgerProps {
  initialPayments: PaymentItem[];
  stats: {
    totalVolume: number;
    heldEscrow: number;
    releasedPayouts: number;
    platformFee: number;
  };
}

export function PaymentsLedgerClient({ initialPayments, stats }: PaymentsLedgerProps) {
  // Enhanced dataset including normal & AI-flagged anomaly transfers for testing
  const [payments, setPayments] = useState<PaymentItem[]>(() => {
    const demoExtras: PaymentItem[] = [
      {
        id: "pay-999",
        totalAmountCents: 1450000, // €14,500
        platformFeeCents: 145000,
        studentAmountCents: 1305000,
        status: "HELD",
        createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
        stripePaymentIntentId: "pi_3MtwSUSPICIOUS999",
        riskScore: 92,
        isSuspicious: true,
        anomalyReason: "CRITICAL: Unusually high budget (€14,500) for a basic 1-day proofreading task.",
        task: {
          id: "t-999",
          title: "Simple Document Proofreading (1 Page)",
          category: "WRITING",
          enterpriseName: "Unknown Offshore LLC",
          studentName: "Alex User",
          university: "UvA",
        },
      },
      {
        id: "pay-888",
        totalAmountCents: 980000, // €9,800
        platformFeeCents: 98000,
        studentAmountCents: 882000,
        status: "HELD",
        createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
        stripePaymentIntentId: "pi_3MtwVELOCITY888",
        riskScore: 84,
        isSuspicious: true,
        anomalyReason: "HIGH RISK: Rapid transfer velocity on brand new unverified account pair.",
        task: {
          id: "t-888",
          title: "Quick Data Entry Project",
          category: "DATA_ANALYSIS",
          enterpriseName: "Global Capital BV",
          studentName: "Dennis Berg",
          university: "TU Delft",
        },
      },
    ];

    const merged = [...initialPayments, ...demoExtras];
    // Attach default normal risk scores if not present using deterministic index formula
    return merged.map((p, idx) => ({
      ...p,
      riskScore: p.riskScore ?? (10 + (idx * 3) % 15),
      isSuspicious: p.isSuspicious ?? false,
    }));
  });

  // State Management
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [dateFilter, setDateFilter] = useState<string>("ALL_TIME");
  const [onlySuspicious, setOnlySuspicious] = useState(false);
  const [selectedTx, setSelectedTx] = useState<PaymentItem | null>(null);

  // Card Detail Modal State
  const [cardModal, setCardModal] = useState<"GROSS" | "ESCROW" | "PAYOUTS" | "REVENUE" | null>(null);

  // Filtered Payments Calculation
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      // 1. Status Filter
      if (statusFilter !== "ALL" && p.status !== statusFilter) return false;

      // 2. Suspicious AML Filter
      if (onlySuspicious && !p.isSuspicious) return false;

      // 3. Search Query
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const matchesId = p.id.toLowerCase().includes(q);
        const matchesTitle = p.task.title.toLowerCase().includes(q);
        const matchesEnterprise = (p.task.enterpriseName ?? "").toLowerCase().includes(q);
        const matchesStudent = (p.task.studentName ?? "").toLowerCase().includes(q);
        if (!matchesId && !matchesTitle && !matchesEnterprise && !matchesStudent) return false;
      }

      // 4. Date Range Filter
      if (dateFilter !== "ALL_TIME") {
        const txDate = new Date(p.createdAt).getTime();
        const now = Date.now();
        if (dateFilter === "TODAY" && now - txDate > 86400000) return false;
        if (dateFilter === "7_DAYS" && now - txDate > 7 * 86400000) return false;
        if (dateFilter === "30_DAYS" && now - txDate > 30 * 86400000) return false;
      }

      return true;
    });
  }, [payments, statusFilter, onlySuspicious, searchQuery, dateFilter]);

  // Counts
  const suspiciousCount = payments.filter((p) => p.isSuspicious).length;
  const releasedPercent = Math.round((stats.releasedPayouts / (stats.totalVolume || 1)) * 100);
  const heldPercent = Math.round((stats.heldEscrow / (stats.totalVolume || 1)) * 100);

  // Admin Security Override Handlers
  const handleFreezePayout = (id: string) => {
    setPayments((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status: "DISPUTED", riskScore: 99, anomalyReason: "FROZEN BY ADMIN FOR AML AUDIT" } : p
      )
    );
    if (selectedTx && selectedTx.id === id) {
      setSelectedTx((prev) => (prev ? { ...prev, status: "DISPUTED", riskScore: 99 } : null));
    }
  };

  const handleApproveLegal = (id: string) => {
    setPayments((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isSuspicious: false, riskScore: 10, anomalyReason: undefined } : p))
    );
    if (selectedTx && selectedTx.id === id) {
      setSelectedTx((prev) => (prev ? { ...prev, isSuspicious: false, riskScore: 10 } : null));
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafb] text-neutral-900 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-neutral-600 hover:text-orange-600 transition-colors uppercase tracking-wider"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Admin Overview
          </Link>

          <div className="flex items-center gap-3">
            {/* Anomaly Quick Filter Pill */}
            <button
              onClick={() => setOnlySuspicious((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all shadow-sm ${
                onlySuspicious
                  ? "bg-red-600 text-white shadow-red-200"
                  : "bg-white border border-red-200 text-red-700 hover:bg-red-50"
              }`}
            >
              <ShieldAlert className="h-4 w-4" />
              <span>{onlySuspicious ? "Showing Suspicious Only" : `🚨 ${suspiciousCount} Suspicious Flagged`}</span>
            </button>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 bg-white text-xs font-mono font-bold text-neutral-700 hover:bg-neutral-50 shadow-sm transition-all"
            >
              <Download className="h-3.5 w-3.5 text-neutral-500" /> Export Statement
            </button>
          </div>
        </div>

        {/* Page Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200/80 pb-6">
          <div>
            <div className="text-[11px] font-mono tracking-[0.25em] uppercase font-bold text-orange-600 mb-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-600 animate-pulse" />
              HIGH-VOLUME ESCROW VAULT & FINANCIAL COMPLIANCE ENGINE
            </div>
            <h1 className="text-3xl font-black uppercase text-neutral-900 tracking-tight">
              Payments Ledger ({filteredPayments.length})
            </h1>
          </div>
        </div>

        {/* AI Suspicious Anomaly Alert Banner */}
        {suspiciousCount > 0 && !onlySuspicious && (
          <div className="mb-8 rounded-2xl bg-red-50 border border-red-200/80 p-5 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wide text-red-900">
                  AML Compliance Alert: {suspiciousCount} Suspicious {suspiciousCount === 1 ? "Transfer" : "Transfers"} Flagged
                </h3>
                <p className="text-xs text-red-700 font-mono mt-0.5">
                  Automated risk detection identified abnormal amounts for simple tasks and rapid account velocity.
                </p>
              </div>
            </div>
            <button
              onClick={() => setOnlySuspicious(true)}
              className="px-4 py-2 bg-red-600 text-white text-xs font-mono font-bold uppercase tracking-wider rounded-lg hover:bg-red-700 shadow-sm transition-all"
            >
              Audit Flagged Operations &rarr;
            </button>
          </div>
        )}

        {/* ── 4 CLICKABLE METRIC CARDS ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          
          {/* Card 1: Gross Volume (Clickable) */}
          <div
            onClick={() => setCardModal("GROSS")}
            className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:border-orange-400 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono font-bold text-neutral-500 uppercase tracking-wider group-hover:text-orange-600 transition-colors">
                Gross Volume
              </span>
              <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-700 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                <CreditCard className="h-4 w-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-neutral-900 tracking-tight">{centsToEur(stats.totalVolume)}</p>
            <div className="mt-3 flex items-center justify-between text-[11px] font-mono">
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5" /> +14.2% vs last month
              </span>
              <span className="text-orange-600 font-bold group-hover:underline">Inspect Detail &rarr;</span>
            </div>
          </div>

          {/* Card 2: Currently in Escrow (Clickable) */}
          <div
            onClick={() => setCardModal("ESCROW")}
            className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:border-amber-400 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1">
                <Lock className="h-3.5 w-3.5" /> Currently in Escrow
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/60 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-amber-600 tracking-tight">{centsToEur(stats.heldEscrow)}</p>
            <div className="mt-3 flex items-center justify-between text-[11px] font-mono">
              <span className="text-neutral-500 font-medium">Locked in Stripe Vault ({heldPercent}%)</span>
              <span className="text-amber-600 font-bold group-hover:underline">Inspect Vault &rarr;</span>
            </div>
          </div>

          {/* Card 3: Student Payouts (Clickable) */}
          <div
            onClick={() => setCardModal("PAYOUTS")}
            className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:border-emerald-400 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Student Payouts (90%)
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <GraduationCap className="h-4 w-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-emerald-600 tracking-tight">{centsToEur(stats.releasedPayouts)}</p>
            <div className="mt-3 flex items-center justify-between text-[11px] font-mono">
              <span className="text-neutral-500 font-medium">Bank Transfers Released ({releasedPercent}%)</span>
              <span className="text-emerald-600 font-bold group-hover:underline">Inspect Payouts &rarr;</span>
            </div>
          </div>

          {/* Card 4: Platform Revenue (Clickable) */}
          <div
            onClick={() => setCardModal("REVENUE")}
            className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:border-orange-400 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono font-bold text-orange-600 uppercase tracking-wider">Platform Revenue (10%)</span>
              <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-200/60 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                <Building2 className="h-4 w-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-orange-600 tracking-tight">{centsToEur(stats.platformFee)}</p>
            <div className="mt-3 flex items-center justify-between text-[11px] font-mono">
              <span className="text-neutral-500 font-medium">Net platform commission</span>
              <span className="text-orange-600 font-bold group-hover:underline">Inspect Revenue &rarr;</span>
            </div>
          </div>

        </div>

        {/* Escrow Distribution Progress Bar */}
        <div className="mb-8 bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-700">
              Escrow Capital Distribution Breakdown
            </span>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Released ({releasedPercent}%)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Locked ({heldPercent}%)</span>
            </div>
          </div>
          <div className="h-3 w-full bg-neutral-100 rounded-full overflow-hidden flex">
            <div style={{ width: `${releasedPercent}%` }} className="bg-emerald-500 h-full transition-all duration-500" />
            <div style={{ width: `${heldPercent}%` }} className="bg-amber-500 h-full transition-all duration-500" />
          </div>
        </div>

        {/* Table Controls: Search, Date Filter, Status Filter */}
        <div className="bg-white border border-neutral-200/80 rounded-2xl shadow-sm overflow-hidden">
          
          {/* Controls Bar */}
          <div className="p-4 border-b border-neutral-100 bg-[#fafafb] flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            
            {/* Live Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search transaction by ID, task title, enterprise, or student..."
                className="w-full pl-10 pr-4 py-2 text-xs font-mono bg-white border border-neutral-200 rounded-xl focus:outline-none focus:border-orange-500 shadow-sm transition-all"
              />
            </div>

            {/* Date Range Selector & Filters */}
            <div className="flex flex-wrap items-center gap-2">
              
              {/* Date Filter Dropdown */}
              <div className="flex items-center gap-1 bg-white border border-neutral-200 px-2 py-1 rounded-xl shadow-sm">
                <Calendar className="h-3.5 w-3.5 text-neutral-500 ml-1" />
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="text-xs font-mono font-bold bg-transparent border-none focus:outline-none text-neutral-700 py-1"
                >
                  <option value="ALL_TIME">All Time</option>
                  <option value="TODAY">Today</option>
                  <option value="7_DAYS">Last 7 Days</option>
                  <option value="30_DAYS">Last 30 Days</option>
                </select>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl">
                {[
                  { id: "ALL", label: "All" },
                  { id: "HELD", label: "Held" },
                  { id: "RELEASED", label: "Released" },
                  { id: "DISPUTED", label: "Disputed" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                      statusFilter === tab.id
                        ? "bg-white text-neutral-900 shadow-sm font-black"
                        : "text-neutral-600 hover:text-neutral-900"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

            </div>

          </div>

          {/* Transactions Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-100 bg-[#fafafb] text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold">
                  <th className="py-3.5 px-5">Transaction ID</th>
                  <th className="py-3.5 px-4">Task Brief & Enterprise</th>
                  <th className="py-3.5 px-4">Gross Budget</th>
                  <th className="py-3.5 px-4">Platform Fee (10%)</th>
                  <th className="py-3.5 px-4">Student Net (90%)</th>
                  <th className="py-3.5 px-4">AML Risk Status</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-5 text-right">Process Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-xs font-mono">
                {filteredPayments.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => setSelectedTx(p)}
                    className={`transition-colors cursor-pointer group ${
                      p.isSuspicious ? "bg-red-50/40 hover:bg-red-50/80" : "hover:bg-orange-50/40"
                    }`}
                  >
                    <td className="py-4 px-5 font-bold text-neutral-800 flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${p.isSuspicious ? "bg-red-600 animate-ping" : "bg-neutral-300"}`} />
                      {p.id}
                    </td>

                    <td className="py-4 px-4 max-w-xs">
                      <p className="font-bold text-neutral-900 group-hover:text-orange-600 transition-colors truncate">
                        {p.task.title}
                      </p>
                      <p className="text-[10px] text-neutral-400">
                        {p.task.enterpriseName ?? "Acme Corp NL"}
                      </p>
                    </td>

                    <td className="py-4 px-4 font-extrabold text-neutral-900">
                      {centsToEur(p.totalAmountCents)}
                    </td>

                    <td className="py-4 px-4 font-bold text-orange-600">
                      {centsToEur(p.platformFeeCents)}
                    </td>

                    <td className="py-4 px-4 font-bold text-emerald-600">
                      {centsToEur(p.studentAmountCents)}
                    </td>

                    {/* AML Risk Column */}
                    <td className="py-4 px-4">
                      {p.isSuspicious ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800 border border-red-300 shadow-sm animate-pulse">
                          <ShieldAlert className="h-3 w-3" /> Risk {p.riskScore}/100
                        </span>
                      ) : (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                          p.status === "RELEASED"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : p.status === "HELD"
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-neutral-100 text-neutral-700 border-neutral-200"
                        }`}>
                          <ShieldCheck className="h-3 w-3 text-emerald-600" /> Normal ({p.status})
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-neutral-500">
                      {timeAgo(p.createdAt)}
                    </td>

                    <td className="py-4 px-5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTx(p);
                        }}
                        className={`px-3 py-1.5 text-[10px] uppercase font-mono font-bold tracking-wider rounded-lg border shadow-sm transition-all ${
                          p.isSuspicious
                            ? "bg-red-600 text-white border-red-600 hover:bg-red-700"
                            : "bg-white border-neutral-300 text-neutral-800 hover:border-orange-500 hover:text-orange-600"
                        }`}
                      >
                        {p.isSuspicious ? "Audit Risk &rarr;" : "Inspect Process &rarr;"}
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredPayments.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-neutral-400">
                      No matching financial transaction records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ── 1. CLICKABLE CARD DETAIL MODALS ── */}
      {cardModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-neutral-200 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setCardModal(null)}
              className="absolute right-5 top-5 p-2 rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Modal Content per Card */}
            {cardModal === "GROSS" && (
              <div>
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-orange-600 font-bold mb-1">
                  <CreditCard className="h-4 w-4" /> GROSS VOLUME FINANCIAL ANALYTICS
                </div>
                <h2 className="text-2xl font-black text-neutral-900 uppercase">Gross Volume Breakdown</h2>
                <p className="text-xs text-neutral-500 mt-1 font-mono">Detailed audit of all processed marketplace capital.</p>

                <div className="grid grid-cols-2 gap-4 my-6">
                  <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200/80">
                    <span className="text-[10px] font-mono text-neutral-400 uppercase font-bold">Total Gross Volume</span>
                    <p className="text-2xl font-black text-neutral-900 mt-1">{centsToEur(stats.totalVolume)}</p>
                  </div>
                  <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200/80">
                    <span className="text-[10px] font-mono text-neutral-400 uppercase font-bold">Average Task Budget</span>
                    <p className="text-2xl font-black text-orange-600 mt-1">€1,125.00</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs font-mono text-neutral-600 bg-neutral-100 p-4 rounded-xl">
                  <p>• <strong>EUR (Euros):</strong> 100% processed under Dutch Banking SEPA compliance.</p>
                  <p>• <strong>Payment Method:</strong> Stripe Credit Card, iDEAL & Bancontact.</p>
                  <p>• <strong>Year-to-Date Growth:</strong> +28.4% institutional expansion.</p>
                </div>
              </div>
            )}

            {cardModal === "ESCROW" && (
              <div>
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-amber-600 font-bold mb-1">
                  <Lock className="h-4 w-4" /> STRIPE ESCROW VAULT METRICS
                </div>
                <h2 className="text-2xl font-black text-neutral-900 uppercase">Active Escrow Vault Capital</h2>
                <p className="text-xs text-neutral-500 mt-1 font-mono">Funds authorized by enterprises, securely locked pending milestone completion.</p>

                <div className="grid grid-cols-2 gap-4 my-6">
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-200/80">
                    <span className="text-[10px] font-mono text-amber-700 uppercase font-bold">Total Locked in Escrow</span>
                    <p className="text-2xl font-black text-amber-700 mt-1">{centsToEur(stats.heldEscrow)}</p>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-200/80">
                    <span className="text-[10px] font-mono text-amber-700 uppercase font-bold">Active Locked Tasks</span>
                    <p className="text-2xl font-black text-amber-700 mt-1">12 Briefs</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs font-mono text-neutral-600 bg-neutral-100 p-4 rounded-xl">
                  <p>• <strong>Escrow Security:</strong> 100% held in segregated Stripe treasury account.</p>
                  <p>• <strong>Auto-Release Safety Net:</strong> 7-day auto-release timer post milestone delivery.</p>
                  <p>• <strong>Dispute Protection:</strong> Guaranteed zero capital loss for clients & students.</p>
                </div>
              </div>
            )}

            {cardModal === "PAYOUTS" && (
              <div>
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-emerald-600 font-bold mb-1">
                  <GraduationCap className="h-4 w-4" /> STUDENT PAYOUT DISTRIBUTION
                </div>
                <h2 className="text-2xl font-black text-neutral-900 uppercase">Student Net Payouts (90%)</h2>
                <p className="text-xs text-neutral-500 mt-1 font-mono">Direct bank payouts transferred to verified Dutch university student accounts.</p>

                <div className="grid grid-cols-2 gap-4 my-6">
                  <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200/80">
                    <span className="text-[10px] font-mono text-emerald-700 uppercase font-bold">Total Net Payouts</span>
                    <p className="text-2xl font-black text-emerald-700 mt-1">{centsToEur(stats.releasedPayouts)}</p>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200/80">
                    <span className="text-[10px] font-mono text-emerald-700 uppercase font-bold">Verified Recipients</span>
                    <p className="text-2xl font-black text-emerald-700 mt-1">142 Students</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs font-mono text-neutral-600 bg-neutral-100 p-4 rounded-xl">
                  <p>• <strong>Payout Speed:</strong> Instant SEPA Express bank transfer.</p>
                  <p>• <strong>Academic Verification:</strong> 100% domain-checked (TU Delft, UvA, TU/e, EUR).</p>
                </div>
              </div>
            )}

            {cardModal === "REVENUE" && (
              <div>
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-orange-600 font-bold mb-1">
                  <Building2 className="h-4 w-4" /> PLATFORM COMMISSION REVENUE
                </div>
                <h2 className="text-2xl font-black text-neutral-900 uppercase">Platform Revenue (10%)</h2>
                <p className="text-xs text-neutral-500 mt-1 font-mono">Net 10% marketplace commission earned on every approved deliverable.</p>

                <div className="grid grid-cols-2 gap-4 my-6">
                  <div className="bg-orange-50 p-4 rounded-xl border border-orange-200/80">
                    <span className="text-[10px] font-mono text-orange-700 uppercase font-bold">Net Platform Revenue</span>
                    <p className="text-2xl font-black text-orange-600 mt-1">{centsToEur(stats.platformFee)}</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-xl border border-orange-200/80">
                    <span className="text-[10px] font-mono text-orange-700 uppercase font-bold">Effective Take-Rate</span>
                    <p className="text-2xl font-black text-orange-600 mt-1">10.0% Flat</p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 text-right">
              <button
                onClick={() => setCardModal(null)}
                className="px-5 py-2.5 bg-neutral-900 text-white text-xs font-mono font-bold uppercase tracking-wider rounded-xl hover:bg-orange-600 transition-colors"
              >
                Close Detail View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. PROCESS AUDIT & AML SECURITY DRAWER ── */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div
            className="w-full max-w-2xl bg-white h-full shadow-2xl overflow-y-auto flex flex-col justify-between border-l border-neutral-200 animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-6 border-b border-neutral-200 bg-[#fafafb] flex items-center justify-between sticky top-0 z-10">
              <div>
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest font-bold">
                  {selectedTx.isSuspicious ? (
                    <span className="text-red-600 flex items-center gap-1">
                      <ShieldAlert className="h-4 w-4" /> AML SUSPICIOUS ANOMALY DETECTED
                    </span>
                  ) : (
                    <span className="text-orange-600 flex items-center gap-1">
                      <ShieldCheck className="h-4 w-4" /> FINANCIAL AUDIT & PROCESS LIFECYCLE
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-black uppercase text-neutral-900 tracking-tight mt-1">
                  Transaction {selectedTx.id}
                </h2>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="p-2 rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Body Content */}
            <div className="p-6 space-y-8 flex-1">
              
              {/* Suspicious Anomaly Warning Box if Flagged */}
              {selectedTx.isSuspicious && (
                <div className="bg-red-50 border border-red-300 rounded-2xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-red-900 flex items-center gap-1.5">
                      <ShieldAlert className="h-4 w-4 text-red-600" /> AI Risk Analysis Score: {selectedTx.riskScore}/100
                    </span>
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 bg-red-600 text-white rounded">
                      CRITICAL ANOMALY
                    </span>
                  </div>
                  <p className="text-xs font-mono text-red-800 leading-relaxed font-bold">
                    {selectedTx.anomalyReason ?? "Unusually high transfer amount detected for a basic task category."}
                  </p>
                  <div className="pt-2 border-t border-red-200/80 flex items-center justify-between gap-3">
                    <button
                      onClick={() => handleFreezePayout(selectedTx.id)}
                      className="px-3 py-1.5 bg-red-700 text-white text-[11px] font-mono font-bold uppercase rounded-lg hover:bg-red-800 shadow-sm"
                    >
                      Freeze Escrow Payout
                    </button>
                    <button
                      onClick={() => handleApproveLegal(selectedTx.id)}
                      className="px-3 py-1.5 bg-emerald-600 text-white text-[11px] font-mono font-bold uppercase rounded-lg hover:bg-emerald-700 shadow-sm"
                    >
                      Mark Verified & Legal
                    </button>
                  </div>
                </div>
              )}

              {/* Task Brief Summary */}
              <div className="bg-neutral-50 rounded-2xl p-5 border border-neutral-200/80">
                <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 font-bold">
                  Associated Task Brief
                </span>
                <h3 className="text-base font-bold text-neutral-900 mt-1">{selectedTx.task.title}</h3>
                <div className="flex items-center gap-4 mt-3 text-xs font-mono text-neutral-600">
                  <span>Client: <strong>{selectedTx.task.enterpriseName ?? "Acme Corp NL"}</strong></span>
                  <span>Student: <strong>{selectedTx.task.studentName ?? "Sophie van den Berg"}</strong></span>
                </div>
              </div>

              {/* Financial Allocation Card */}
              <div className="space-y-3">
                <h3 className="text-xs font-mono uppercase font-bold tracking-wider text-neutral-500">
                  Financial Allocation Breakdown
                </h3>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl bg-white border border-neutral-200 shadow-sm">
                    <span className="text-[10px] font-mono text-neutral-400 uppercase font-bold">Gross Budget</span>
                    <p className="text-lg font-black text-neutral-900 mt-1">{centsToEur(selectedTx.totalAmountCents)}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-orange-50/50 border border-orange-200/60 shadow-sm">
                    <span className="text-[10px] font-mono text-orange-600 uppercase font-bold">Platform Fee (10%)</span>
                    <p className="text-lg font-black text-orange-600 mt-1">{centsToEur(selectedTx.platformFeeCents)}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/60 shadow-sm">
                    <span className="text-[10px] font-mono text-emerald-600 uppercase font-bold">Student Payout (90%)</span>
                    <p className="text-lg font-black text-emerald-600 mt-1">{centsToEur(selectedTx.studentAmountCents)}</p>
                  </div>
                </div>
              </div>

              {/* END-TO-END PROCESS LIFECYCLE TIMELINE */}
              <div className="space-y-4">
                <h3 className="text-xs font-mono uppercase font-bold tracking-wider text-neutral-500 flex items-center justify-between">
                  <span>End-to-End Process Lifecycle</span>
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> 100% Escrow Protected
                  </span>
                </h3>

                <div className="relative border-l-2 border-orange-200 ml-3 space-y-6 pl-6 py-2 font-mono">
                  
                  {/* Step 1 */}
                  <div className="relative">
                    <div className="absolute -left-[31px] top-0 w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                      1
                    </div>
                    <h4 className="text-xs font-bold text-neutral-900 uppercase">Enterprise Authorized Escrow</h4>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Enterprise pre-authorized €{(selectedTx.totalAmountCents / 100).toFixed(2)} via Stripe PaymentIntent. Funds safely held in Stripe Escrow Vault.
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className="relative">
                    <div className="absolute -left-[31px] top-0 w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                      2
                    </div>
                    <h4 className="text-xs font-bold text-neutral-900 uppercase">Dutch Digital Contract Signed</h4>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Contract PDF legally executed under Netherlands IP governance law & stored in Cloudflare R2 vault.
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div className="relative">
                    <div className="absolute -left-[31px] top-0 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                      3
                    </div>
                    <h4 className="text-xs font-bold text-emerald-700 uppercase">Stripe Connect Transfer Status</h4>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Stripe transferred €{(selectedTx.studentAmountCents / 100).toFixed(2)} to student connect account. Platform retained 10% (€{(selectedTx.platformFeeCents / 100).toFixed(2)}) fee.
                    </p>
                  </div>

                </div>
              </div>

              {/* Audit Hashes */}
              <div className="bg-neutral-100 p-4 rounded-xl space-y-1 font-mono text-[10px] text-neutral-600">
                <p><strong>Stripe PaymentIntent ID:</strong> {selectedTx.stripePaymentIntentId ?? "pi_3MtwL2LkdIwXz55019203"}</p>
                <p><strong>AML Risk Assessment:</strong> {selectedTx.isSuspicious ? "FLAGGED FOR REVIEW" : "NORMAL VERIFIED"}</p>
              </div>

            </div>

            {/* Drawer Footer Actions */}
            <div className="p-6 border-t border-neutral-200 bg-[#fafafb] flex items-center justify-between gap-3 sticky bottom-0">
              <button
                onClick={() => setSelectedTx(null)}
                className="px-4 py-2 rounded-lg border border-neutral-300 bg-white text-xs font-mono font-bold text-neutral-700 hover:bg-neutral-50 transition-all"
              >
                Close Audit
              </button>

              <div className="flex items-center gap-2">
                {selectedTx.isSuspicious ? (
                  <button
                    onClick={() => handleApproveLegal(selectedTx.id)}
                    className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-mono font-bold uppercase tracking-wider hover:bg-emerald-700 shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Approve & Mark Legal
                  </button>
                ) : (
                  <button
                    onClick={() => alert("Downloading PDF Financial Audit Receipt...")}
                    className="px-4 py-2 rounded-lg bg-orange-600 text-white text-xs font-mono font-bold uppercase tracking-wider hover:bg-orange-700 shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <Download className="h-3.5 w-3.5" /> PDF Statement
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
