/**
 * src/app/student/applications/page.tsx
 *
 * Student Application Roster Page — Ultra-Luxury Range Rover / Apple Design Philosophy.
 * Server Component: Fetches student's submitted proposals with status badges and milestone progress.
 */

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { centsToEur, formatDate, truncate, CATEGORY_LABELS } from "@/lib/utils";
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChevronRight,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import type { ApplicationStatus } from "@prisma/client";

export const metadata: Metadata = {
  title:       "My Applications",
  description: "View and track your submitted task proposals and enterprise selection decisions.",
};

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; bg: string; text: string; border: string; icon: typeof CheckCircle2 }> = {
  PENDING:     { label: "PENDING REVIEW", bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", icon: Clock },
  REVIEWED:    { label: "UNDER REVIEW",   bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200",   icon: Clock },
  SHORTLISTED: { label: "SHORTLISTED",    bg: "bg-amber-50",  text: "text-amber-800",  border: "border-amber-200",  icon: AlertCircle },
  SELECTED:    { label: "SELECTED & ASSIGNED", bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200", icon: CheckCircle2 },
  REJECTED:    { label: "NOT SELECTED",   bg: "bg-neutral-100", text: "text-neutral-600", border: "border-neutral-200", icon: XCircle },
  WITHDRAWN:   { label: "WITHDRAWN",      bg: "bg-neutral-100", text: "text-neutral-500", border: "border-neutral-200", icon: XCircle },
};

export default async function StudentApplicationsPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "STUDENT") {
    redirect("/login?callbackUrl=/student/applications");
  }

  let applications: any[] = [];

  try {
    applications = await db.application.findMany({
      where: { studentId: session.user.id },
      include: {
        task: {
          include: {
            enterprise: {
              select: {
                enterpriseProfile: { select: { companyName: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (err) {
    console.warn("[StudentApplicationsPage] DB fetch error:", err);
  }

  const totalCount = applications.length;
  const pendingCount = applications.filter((a) => a.status === "PENDING" || a.status === "REVIEWED").length;
  const shortlistedCount = applications.filter((a) => a.status === "SHORTLISTED").length;
  const selectedCount = applications.filter((a) => a.status === "SELECTED").length;

  return (
    <div className="min-h-screen bg-[#fafafb] text-neutral-900 py-12 md:py-16">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 mb-8 text-xs font-mono">
          <Link
            href="/student/dashboard"
            className="text-neutral-500 hover:text-orange-600 transition-colors flex items-center gap-1 font-bold"
          >
            <ArrowLeft size={13} />
            DASHBOARD
          </Link>
          <span className="text-neutral-300">/</span>
          <span className="text-orange-600 font-bold uppercase tracking-wider">
            MY APPLICATIONS
          </span>
        </div>

        {/* Hero Header */}
        <div className="mb-12">
          <div className="text-[11px] font-mono tracking-[0.3em] uppercase font-bold text-orange-600 mb-2">
            STUDENT APPLICATION ROSTER
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-[#111827] uppercase">
            MY SUBMITTED PROPOSALS
          </h1>
          <p className="text-neutral-600 mt-2 max-w-xl text-xs sm:text-sm leading-relaxed font-normal">
            Track real-time submission status, enterprise reviews, shortlist decisions, and milestone contract assignments.
          </p>
        </div>

        {/* Status Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-sm">
            <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Total Submitted</span>
            <div className="text-2xl font-black text-neutral-900 mt-1">{totalCount}</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-sm">
            <span className="text-[10px] font-mono font-bold text-orange-600 uppercase">Pending Review</span>
            <div className="text-2xl font-black text-orange-600 mt-1">{pendingCount}</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-sm">
            <span className="text-[10px] font-mono font-bold text-amber-600 uppercase">Shortlisted</span>
            <div className="text-2xl font-black text-amber-600 mt-1">{shortlistedCount}</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-sm">
            <span className="text-[10px] font-mono font-bold text-emerald-600 uppercase">Selected & Assigned</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">{selectedCount}</div>
          </div>
        </div>

        {/* Applications Roster List */}
        {totalCount > 0 ? (
          <div className="space-y-6">
            {applications.map((app) => {
              const task = app.task;
              const companyName = task.enterprise?.enterpriseProfile?.companyName ?? "Dutch Enterprise";
              const status = STATUS_CONFIG[app.status as ApplicationStatus] ?? STATUS_CONFIG.PENDING;
              const StatusIcon = status.icon;
              const categoryLabel = (CATEGORY_LABELS as Record<string, string>)[task.category] ?? task.category;
              const budgetDisplay = app.proposedBudgetCents ? centsToEur(app.proposedBudgetCents) : centsToEur(task.budgetCents);

              return (
                <div
                  key={app.id}
                  className="bg-white rounded-2xl p-7 md:p-8 border border-neutral-200/90 shadow-sm relative overflow-hidden group hover:border-orange-400 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-bl-full pointer-events-none" />

                  <div>
                    {/* Header: Company + Category + Status Badge */}
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-neutral-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                        <span className="text-xs uppercase tracking-widest font-mono font-bold text-neutral-900 group-hover:text-orange-600 transition-colors">
                          {companyName}
                        </span>
                        <span className="text-neutral-300">&middot;</span>
                        <span className="text-[10px] font-mono font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                          {categoryLabel}
                        </span>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1.5 font-mono text-[10px] uppercase font-bold px-3 py-1 rounded-full border ${status.bg} ${status.text} ${status.border}`}
                      >
                        <StatusIcon size={12} />
                        {status.label}
                      </span>
                    </div>

                    {/* Task Title */}
                    <h2 className="text-lg sm:text-xl font-black text-neutral-900 leading-snug group-hover:text-orange-600 transition-colors mb-3 uppercase tracking-wide">
                      {task.title}
                    </h2>

                    {/* Cover Letter Excerpt */}
                    <p className="text-xs sm:text-sm text-neutral-600 line-clamp-3 leading-relaxed mb-6 font-normal">
                      &ldquo;{truncate(app.coverLetter, 220)}&rdquo;
                    </p>
                  </div>

                  {/* Footer Meta Row */}
                  <div className="flex flex-wrap items-center justify-between border-t border-neutral-100 pt-4 gap-4 mt-auto">
                    <div className="flex flex-wrap items-center gap-5 text-xs font-mono">
                      <div>
                        <span className="text-neutral-400 uppercase font-bold text-[10px] block">Proposed Fee</span>
                        <span className="font-extrabold text-orange-600">{budgetDisplay}</span>
                      </div>
                      {app.estimatedDays && (
                        <div>
                          <span className="text-neutral-400 uppercase font-bold text-[10px] block">Timeline</span>
                          <span className="font-bold text-neutral-800">{app.estimatedDays} Days</span>
                        </div>
                      )}
                      <div>
                        <span className="text-neutral-400 uppercase font-bold text-[10px] block">Submitted On</span>
                        <span className="font-medium text-neutral-600">{formatDate(app.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Link
                        href={`/tasks/${task.id}`}
                        className="inline-flex items-center justify-center rounded-lg bg-white border border-neutral-300 px-5 py-2.5 text-xs font-mono uppercase font-bold tracking-wider text-neutral-800 hover:border-orange-500 hover:text-orange-600 active:scale-95 transition-all shadow-sm"
                      >
                        View Brief Details <ChevronRight size={14} className="ml-1" />
                      </Link>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="bg-white rounded-3xl border border-neutral-200/90 p-12 text-center flex flex-col items-center justify-center shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mb-4 shadow-sm">
              <FileText size={32} />
            </div>
            <h2 className="text-xl font-black text-neutral-900 uppercase tracking-wide mb-2">
              No Applications Submitted Yet
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 max-w-md font-normal mb-8 leading-relaxed">
              Explore open corporate briefs from top Dutch enterprises and submit your first proposal protected by Stripe escrow and digital contracts.
            </p>
            <Link
              href="/tasks"
              className="inline-flex items-center justify-center rounded-xl bg-orange-600 px-8 py-3.5 text-xs font-mono font-bold uppercase tracking-widest text-white hover:bg-orange-700 active:scale-95 transition-all shadow-[0_4px_20px_rgba(249,115,22,0.3)]"
            >
              <Sparkles size={14} className="mr-2" />
              Browse Open Briefs &rarr;
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
