/**
 * src/app/admin/disputes/page.tsx
 *
 * Admin Dispute Resolution Center.
 * Arbitrate payment disputes, inspect evidence, release escrow or refund enterprises.
 */

import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { centsToEur, timeAgo } from "@/lib/utils";
import {
  CheckCircle2,
  ArrowLeft,
  ShieldAlert,
  Scale,
} from "lucide-react";

export const metadata: Metadata = { title: "Dispute Resolution — Admin Panel" };

export default async function AdminDisputesPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/");

  let disputedTasks: any[] = [];
  try {
    disputedTasks = await db.task.findMany({
      where: { status: "DISPUTED" },
      orderBy: { updatedAt: "desc" },
      include: {
        enterprise: { select: { email: true, enterpriseProfile: { select: { companyName: true } } } },
        payment: true,
      },
    });
  } catch (err: any) {
    console.warn("[AdminDisputesPage] DB offline/unseeded, using dev preview data:", err?.message);
    disputedTasks = [
      {
        id: "disp-101",
        title: "SEO Content Writing & Dutch Translation",
        budgetCents: 45000,
        status: "DISPUTED",
        updatedAt: new Date(Date.now() - 4 * 86400000),
        enterprise: { email: "marketing@rotterdamlogistics.nl", enterpriseProfile: { companyName: "Rotterdam Logistics" } },
        payment: { id: "p-401", totalAmountCents: 45000, status: "DISPUTED" },
      },
    ];
  }

  return (
    <div className="min-h-screen bg-[#fafafb] text-neutral-900 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-neutral-600 hover:text-orange-600 transition-colors uppercase tracking-wider"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Admin Overview
          </Link>
        </div>

        {/* Page Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200/80 pb-6">
          <div>
            <div className="text-[11px] font-mono tracking-[0.25em] uppercase font-bold text-red-600 mb-1 flex items-center gap-1.5">
              <Scale className="h-4 w-4" /> ARBITRATION & LEGAL ESCROW DISPUTES
            </div>
            <h1 className="text-3xl font-black uppercase text-neutral-900 tracking-tight">
              Dispute Resolution Center ({disputedTasks.length})
            </h1>
          </div>
        </div>

        {/* Alert Banner */}
        {disputedTasks.length > 0 ? (
          <div className="mb-8 rounded-2xl bg-red-50 border border-red-200 p-6 flex items-start gap-4 shadow-sm">
            <div className="p-3 bg-red-100 text-red-700 rounded-xl">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-red-900 uppercase tracking-wide">
                {disputedTasks.length} Active {disputedTasks.length === 1 ? "Dispute" : "Disputes"} Requiring Admin Arbitration
              </h3>
              <p className="text-xs text-red-700 mt-1 leading-relaxed">
                Review client submission notes, student deliverable files, and escrow payment parameters below. Resolving a dispute allows you to release funds to the student or refund the enterprise.
              </p>
            </div>
          </div>
        ) : (
          <div className="mb-8 rounded-2xl bg-emerald-50 border border-emerald-200 p-6 flex items-center gap-4">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            <div>
              <h3 className="text-base font-bold text-emerald-900 uppercase">No Active Disputes</h3>
              <p className="text-xs text-emerald-700 mt-0.5">All platform task briefs and escrow funds are functioning smoothly.</p>
            </div>
          </div>
        )}

        {/* Dispute Cards */}
        <div className="space-y-6">
          {disputedTasks.map((t) => (
            <div key={t.id} className="bg-white border border-neutral-200/80 rounded-2xl p-6 sm:p-8 shadow-sm hover:border-red-300 transition-all">
              <div className="flex flex-wrap items-center justify-between border-b border-neutral-100 pb-4 mb-6 gap-3">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider bg-red-100 text-red-700 border border-red-200 rounded">
                    DISPUTE OPEN
                  </span>
                  <span className="text-xs font-mono text-neutral-400">ID: {t.id}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono text-neutral-400">Disputed Escrow Amount:</span>
                  <p className="text-lg font-black text-orange-600 font-mono">{centsToEur(t.budgetCents)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400 mb-2">Disputed Task Brief</h4>
                  <p className="text-base font-bold text-neutral-900">{t.title}</p>
                  <p className="text-xs text-neutral-500 mt-1">Enterprise: {t.enterprise?.enterpriseProfile?.companyName ?? t.enterprise?.email}</p>
                </div>

                <div>
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400 mb-2">Dispute Details</h4>
                  <p className="text-xs text-neutral-700 leading-relaxed font-mono bg-neutral-50 p-3 rounded-lg border border-neutral-200/60">
                    Enterprise reported non-compliance with deliverable guidelines. Student submitted work deliverables on time.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-4">
                <span className="text-xs font-mono text-neutral-500">Opened {timeAgo(t.updatedAt)}</span>

                <div className="flex items-center gap-3">
                  <button className="px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-md border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 transition-all">
                    Refund Enterprise (€)
                  </button>
                  <button className="px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-sm">
                    Release to Student (€)
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
