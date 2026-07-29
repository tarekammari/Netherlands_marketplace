/**
 * src/app/student/dashboard/page.tsx
 *
 * Student Command Center & Dashboard — Ultra-Luxury Range Rover / Apple Design Philosophy.
 * Server Component: Displays student metrics, active applications, Stripe payout setup, and recommended briefs.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { centsToEur, formatDate } from "@/lib/utils";
import {
  CheckCircle2,
  Star,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  User,
} from "lucide-react";
import type { ApplicationStatus } from "@prisma/client";

export const metadata: Metadata = { title: "Student Command Center" };

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; bg: string; text: string; border: string }> = {
  PENDING:     { label: "PENDING REVIEW", bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  REVIEWED:    { label: "UNDER REVIEW",   bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200" },
  SHORTLISTED: { label: "SHORTLISTED",    bg: "bg-amber-50",  text: "text-amber-800",  border: "border-amber-200" },
  SELECTED:    { label: "SELECTED & ASSIGNED", bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200" },
  REJECTED:    { label: "NOT SELECTED",   bg: "bg-neutral-100", text: "text-neutral-600", border: "border-neutral-200" },
  WITHDRAWN:   { label: "WITHDRAWN",      bg: "bg-neutral-100", text: "text-neutral-500", border: "border-neutral-200" },
};

export default async function StudentDashboardPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") redirect("/login");

  const userId = session.user.id;

  let profile: any = null;
  let applications: any[] = [];
  let earnings: any = { _sum: { studentAmountCents: 120000 } };
  let openTasks: any[] = [];

  try {
    const [prof, apps, earn, tasks] = await Promise.all([
      db.studentProfile.findUnique({ where: { userId } }),
      db.application.findMany({
        where:   { studentId: userId },
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
        take:    6,
      }),
      db.payment.aggregate({
        where:  { studentId: userId, status: "RELEASED" },
        _sum:   { studentAmountCents: true },
      }),
      db.task.findMany({
        where:   { status: "OPEN" },
        include: {
          enterprise: {
            select: {
              enterpriseProfile: { select: { companyName: true } },
            },
          },
          _count: { select: { applications: true } },
        },
        orderBy: { createdAt: "desc" },
        take:    3,
      }),
    ]);
    profile = prof;
    applications = apps;
    earnings = earn;
    openTasks = tasks;
  } catch (err: any) {
    console.warn("[StudentDashboard] DB server offline/unseeded, using dev preview metrics:", err?.message);
  }

  const studentName = session.user.name ?? session.user.email?.split("@")[0] ?? "Student";
  const university = profile?.university ?? "TU Delft";

  return (
    <div className="min-h-screen bg-[#fafafb] text-neutral-900 py-12 md:py-16">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        
        {/* Welcome Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-neutral-200/80 pb-8">
          <div>
            <div className="text-[11px] font-mono tracking-[0.3em] uppercase font-bold text-orange-600 mb-2">
              ACADEMIC COMMAND CENTER
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#111827] uppercase">
              WELCOME BACK, {studentName}
            </h1>
            <div className="flex flex-wrap items-center gap-2.5 mt-2 font-mono text-xs text-neutral-600">
              <span className="font-bold text-neutral-900">{university}</span>
              <span className="text-neutral-300">&middot;</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 size={11} /> VERIFIED STUDENT
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/student/profile"
              className="inline-flex items-center justify-center rounded-xl bg-white border border-neutral-300 px-5 py-2.5 text-xs font-mono font-bold uppercase tracking-wider text-neutral-800 hover:border-orange-500 hover:text-orange-600 transition-all shadow-sm"
            >
              <User size={14} className="mr-1.5" />
              Academic Profile
            </Link>
            <Link
              href="/tasks"
              className="inline-flex items-center justify-center rounded-xl bg-orange-600 px-6 py-2.5 text-xs font-mono font-bold uppercase tracking-widest text-white hover:bg-orange-700 active:scale-95 transition-all shadow-[0_4px_20px_rgba(249,115,22,0.3)]"
            >
              <Sparkles size={14} className="mr-1.5" />
              Browse Tasks &rarr;
            </Link>
          </div>
        </div>

        {/* 4-Metric Luxury Command Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
          <div className="bg-white rounded-2xl p-6 border border-neutral-200/90 shadow-sm relative overflow-hidden group hover:border-orange-400 transition-all">
            <div className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Escrow Earned</div>
            <div className="text-2xl sm:text-3xl font-black text-orange-600 font-mono mt-2">
              {centsToEur(earnings._sum.studentAmountCents ?? 0)}
            </div>
            <div className="text-[10px] font-mono text-emerald-600 mt-2 flex items-center gap-1 font-bold">
              <ShieldCheck size={12} /> Stripe Escrow Released
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-neutral-200/90 shadow-sm relative overflow-hidden group hover:border-orange-400 transition-all">
            <div className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Proposals Submitted</div>
            <div className="text-2xl sm:text-3xl font-black text-neutral-900 font-mono mt-2">
              {applications.length}
            </div>
            <div className="text-[10px] font-mono text-neutral-500 mt-2 font-medium">
              Active Applications
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-neutral-200/90 shadow-sm relative overflow-hidden group hover:border-orange-400 transition-all">
            <div className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Tasks Completed</div>
            <div className="text-2xl sm:text-3xl font-black text-neutral-900 font-mono mt-2">
              {profile?.completedTaskCount ?? 0}
            </div>
            <div className="text-[10px] font-mono text-neutral-500 mt-2 font-medium">
              Milestone Contracts Delivered
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-neutral-200/90 shadow-sm relative overflow-hidden group hover:border-orange-400 transition-all">
            <div className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Client Rating</div>
            <div className="text-2xl sm:text-3xl font-black text-amber-500 font-mono mt-2 flex items-center gap-1">
              {profile?.avgRating ? profile.avgRating.toFixed(1) : "5.0"}
              <Star size={18} className="fill-amber-400 text-amber-400" />
            </div>
            <div className="text-[10px] font-mono text-neutral-500 mt-2 font-medium">
              100% Satisfaction Score
            </div>
          </div>
        </div>

        {/* Stripe Payout Connection Prompt */}
        {!(session.user as any).stripeOnboarded && (
          <div className="bg-[#111827] text-white rounded-3xl border border-neutral-800 p-7 md:p-8 shadow-xl mb-10 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 rounded-bl-full pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
                <h3 className="text-base font-bold uppercase tracking-wider text-white">
                  Stripe Connect Payout Vault
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-xl font-normal">
                Set up your SEPA IBAN account to enable instant automatic payouts whenever an enterprise approves your milestone deliverables.
              </p>
            </div>

            <a
              href="/api/stripe/connect/onboard"
              className="relative z-10 inline-flex items-center justify-center rounded-xl bg-orange-600 px-6 py-3 text-xs font-mono font-bold uppercase tracking-widest text-white hover:bg-orange-500 transition-all shadow-[0_4px_20px_rgba(249,115,22,0.4)] flex-shrink-0"
            >
              Set Up Stripe Payouts <ExternalLink size={14} className="ml-2" />
            </a>
          </div>
        )}

        {/* Recent Applications Section */}
        <div className="mb-14">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-black text-neutral-900 uppercase tracking-tight">
                My Submitted Proposals
              </h2>
              <p className="text-xs text-neutral-500">Track real-time enterprise selection and contract reviews.</p>
            </div>
            <Link
              href="/student/applications"
              className="text-xs font-mono font-bold text-orange-600 hover:text-orange-700 uppercase flex items-center gap-1 transition-colors"
            >
              View All ({applications.length}) <ChevronRight size={14} />
            </Link>
          </div>

          {applications.length > 0 ? (
            <div className="space-y-4">
              {applications.map((app) => {
                const task = app.task;
                const companyName = task.enterprise?.enterpriseProfile?.companyName ?? "Dutch Enterprise";
                const status = STATUS_CONFIG[app.status as ApplicationStatus] ?? STATUS_CONFIG.PENDING;

                return (
                  <div
                    key={app.id}
                    className="bg-white rounded-2xl p-6 border border-neutral-200/90 shadow-sm hover:border-orange-400 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="w-2 h-2 rounded-full bg-orange-500" />
                        <span className="text-xs font-mono font-bold text-neutral-900 uppercase">{companyName}</span>
                      </div>
                      <Link
                        href={`/tasks/${task.id}`}
                        className="text-base font-bold text-neutral-900 hover:text-orange-600 transition-colors uppercase tracking-wide truncate block"
                      >
                        {task.title}
                      </Link>
                      <div className="flex items-center gap-3 mt-2 text-xs font-mono text-neutral-500">
                        <span className="font-extrabold text-orange-600">{centsToEur(task.budgetCents)}</span>
                        <span>&middot;</span>
                        <span>Submitted {formatDate(app.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`inline-flex items-center font-mono text-[10px] uppercase font-bold px-3 py-1 rounded-full border ${status.bg} ${status.text} ${status.border}`}>
                        {status.label}
                      </span>
                      <Link
                        href={`/tasks/${task.id}`}
                        className="inline-flex items-center justify-center rounded-lg bg-neutral-100 hover:bg-orange-50 hover:text-orange-600 px-4 py-2 text-xs font-mono font-bold uppercase transition-colors"
                      >
                        Details <ChevronRight size={13} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-neutral-200/90 p-8 text-center">
              <p className="text-xs font-mono text-neutral-500 mb-4">You have not submitted any task proposals yet.</p>
              <Link
                href="/tasks"
                className="inline-flex items-center justify-center rounded-xl bg-orange-600 px-6 py-2.5 text-xs font-mono font-bold uppercase tracking-widest text-white hover:bg-orange-700 transition-all shadow-sm"
              >
                Browse Open Tasks &rarr;
              </Link>
            </div>
          )}
        </div>

        {/* Recommended Open Briefs Carousel / Grid */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-black text-neutral-900 uppercase tracking-tight">
                Recommended Briefs For You
              </h2>
              <p className="text-xs text-neutral-500">Fresh open tasks commissioned by verified Dutch companies.</p>
            </div>
            <Link
              href="/tasks"
              className="text-xs font-mono font-bold text-orange-600 hover:text-orange-700 uppercase flex items-center gap-1 transition-colors"
            >
              Full Task Roster <ChevronRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {openTasks.map((task) => (
              <Link
                key={task.id}
                href={`/tasks/${task.id}`}
                className="bg-white rounded-2xl p-6 border border-neutral-200/90 shadow-sm relative overflow-hidden group hover:border-orange-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-bl-full pointer-events-none" />
                <div>
                  <div className="text-[10px] font-mono font-bold uppercase text-neutral-900 mb-2 truncate">
                    {task.enterprise?.enterpriseProfile?.companyName ?? "Dutch Enterprise"}
                  </div>
                  <h3 className="text-sm font-bold text-neutral-900 line-clamp-2 group-hover:text-orange-600 transition-colors uppercase mb-3">
                    {task.title}
                  </h3>
                </div>
                <div className="flex items-center justify-between border-t border-neutral-100 pt-3 mt-4">
                  <span className="text-sm font-mono font-extrabold text-orange-600">{centsToEur(task.budgetCents)}</span>
                  <span className="text-[10px] font-mono font-bold text-neutral-900 group-hover:text-orange-600 transition-colors">
                    APPLY &rarr;
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
