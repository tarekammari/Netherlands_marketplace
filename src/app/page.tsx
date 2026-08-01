/**
 * src/app/page.tsx
 *
 * Public Home Page — Clean, Minimal, Luxury design inspired by apple.com.
 * Fully responsive light theme layout with high contrast typography and bento-grid sections.
 */

import Link from "next/link";
import { db } from "@/lib/db";
import { centsToEur } from "@/lib/utils";
import { UniversityRosterSlider } from "@/components/home/university-roster-slider";
import {
  ShieldCheck,
  FileCheck,
  GraduationCap,
  Users,
  ChevronRight,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// ── Platform Stats ────────────────────────────────────────────────────────────

async function getPlatformStats() {
  try {
    const [taskCount, studentCount, enterpriseCount, completedPayments] = await Promise.all([
      db.task.count({ where: { status: "OPEN" } }),
      db.user.count({ where: { role: "STUDENT" } }),
      db.user.count({ where: { role: "ENTERPRISE" } }),
      db.payment.aggregate({ where: { status: "RELEASED" }, _sum: { studentAmountCents: true } }),
    ]);
    return {
      openTasks: taskCount,
      students: studentCount,
      enterprises: enterpriseCount,
      totalPaidOut: completedPayments._sum.studentAmountCents ?? 0,
    };
  } catch (err) {
    console.error("[HomePage] Database unavailable — check DATABASE_URL on Vercel:", err);
    return { openTasks: 0, students: 0, enterprises: 0, totalPaidOut: 0 };
  }
}

// ── Featured Tasks ────────────────────────────────────────────────────────────

async function getFeaturedTasks() {
  try {
    return await db.task.findMany({
      where: { status: "OPEN" },
      include: {
        enterprise: { select: { enterpriseProfile: { select: { companyName: true } } } },
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 3,
    });
  } catch {
    return [];
  }
}

// ── Budget formatter ──────────────────────────────────────────────────────────

function formatBudget(cents: number) {
  const euros = cents / 100;
  return euros >= 1000
    ? `€${(euros / 1000).toFixed(1)}k`
    : `€${euros.toLocaleString("nl-NL")}`;
}

// ── Homepage ──────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const [stats, tasks] = await Promise.all([getPlatformStats(), getFeaturedTasks()]);

  return (
    <div className="min-h-screen bg-[#fafafb] text-neutral-900 antialiased selection:bg-orange-500 selection:text-white overflow-x-hidden font-sans">

      {/* ── Ambient Light Luxury Glow Backdrops ── */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(249,115,22,0.08)_0%,rgba(249,115,22,0.02)_50%,transparent_80%)] pointer-events-none z-0" />
      <div className="absolute top-[300px] left-1/4 w-96 h-96 bg-orange-100/40 rounded-full blur-3xl pointer-events-none" />

      {/* ── 1. HERO SECTION ── */}
      <section className="relative z-10 pt-10 pb-12 sm:pt-14 sm:pb-20 lg:pt-16 lg:pb-28 px-4 md:px-8 max-w-6xl mx-auto text-center">
        <div className="space-y-4 sm:space-y-5">

          {/* Center bottom of navbar eyebrow */}
          <div className="text-center pt-2 sm:pt-4 mb-1">
            <span className="text-[8px] sm:text-[9px] md:text-[10px] font-mono tracking-[0.25em] uppercase font-bold text-neutral-500">
              DUTCH ENGINEERING &middot; THE NETHERLANDS
            </span>
          </div>

          {/* Headline — EXACTING and STANDARDS on separate lines */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-[#0f172a] leading-[1.05] max-w-4xl mx-auto uppercase">
            <span className="block">REAL TASKS.</span>
            <span className="block bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 bg-clip-text text-transparent">
              EXACTING
            </span>
            <span className="block bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 bg-clip-text text-transparent">
              STANDARDS.
            </span>
            <span className="block">ELITE TALENT.</span>
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-neutral-600 max-w-xl mx-auto leading-relaxed font-normal tracking-wide">
            TaskBridge connects Netherlands enterprises with verified university students from TU Delft, UvA, TU/e, and Erasmus for high-impact deliverables. Protected by Dutch law digital contracts and Stripe escrow.
          </p>

          {/* Light Luxury Orange CTAs - Instantly Visible Above The Fold */}
          <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4 pt-1">
            <Link
              href="/register?role=enterprise"
              className="inline-flex items-center justify-center rounded-sm bg-orange-600 px-6 py-2.5 sm:px-7 sm:py-3 text-[11px] sm:text-xs uppercase font-bold tracking-[0.12em] text-white hover:bg-orange-700 active:scale-95 transition-all shadow-[0_4px_16px_rgba(249,115,22,0.3)]"
            >
              Post a task
            </Link>
            <Link
              href="/tasks"
              className="inline-flex items-center justify-center rounded-sm bg-white border border-neutral-300 px-6 py-2.5 sm:px-7 sm:py-3 text-[11px] sm:text-xs uppercase font-bold tracking-[0.12em] text-neutral-800 hover:border-orange-500 hover:text-orange-600 active:scale-95 transition-all shadow-sm"
            >
              Browse Open Tasks &rarr;
            </Link>
          </div>
        </div>

        {/* ── Simple & Luxury Guarantee Showcase Grid (Generous whitespace so initial fold is clean) ── */}
        <div className="mt-32 sm:mt-44 lg:mt-56 max-w-5xl mx-auto px-4">
          <div className="relative rounded-3xl border border-neutral-200/80 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.04)] p-8 sm:p-12 text-left">

            {/* Header Section Label */}
            <div className="flex flex-wrap items-center justify-between border-b border-neutral-100 pb-6 mb-8 gap-4">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-orange-600 animate-pulse" />
                <span className="text-xs font-mono tracking-[0.2em] uppercase font-bold text-neutral-900">
                  TRUSTED ENTERPRISE PLATFORM &middot; THE NETHERLANDS
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-orange-600 uppercase tracking-widest">
                100% ESCROW PROTECTED
              </span>
            </div>

            {/* 3 Luxury Pillar Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

              {/* Feature 1: Verified Dutch Talent -> /tasks */}
              <Link
                href="/tasks"
                className="group p-6 rounded-2xl bg-[#fafafb] border border-neutral-200/80 hover:border-orange-400 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-200/80 flex items-center justify-center text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-all duration-300 shadow-sm">
                      <GraduationCap size={22} />
                    </div>
                    <span className="font-mono text-[10px] uppercase font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200/60 group-hover:bg-orange-600 group-hover:text-white transition-all flex items-center gap-1">
                      Browse Talent &rarr;
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-neutral-900 mb-2 uppercase tracking-wide group-hover:text-orange-600 transition-colors">
                    Verified Dutch Talent
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-normal mb-6">
                    Domain-checked student specialists from TU Delft, UvA, TU/e, and Erasmus ready for short-term deliverables.
                  </p>
                </div>
                <div className="pt-4 border-t border-neutral-200/60 flex items-center justify-between font-mono text-[11px] font-bold text-orange-600">
                  <span>TU Delft &middot; UvA &middot; EUR</span>
                  <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>

              {/* Feature 2: Stripe Escrow Security -> /pricing */}
              <Link
                href="/pricing"
                className="group p-6 rounded-2xl bg-[#fafafb] border border-neutral-200/80 hover:border-emerald-500 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-200/80 flex items-center justify-center text-orange-600 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-sm">
                      <ShieldCheck size={22} />
                    </div>
                    <span className="font-mono text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 group-hover:bg-emerald-600 group-hover:text-white transition-all flex items-center gap-1">
                      Escrow Info &rarr;
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-neutral-900 mb-2 uppercase tracking-wide group-hover:text-emerald-600 transition-colors">
                    Stripe Escrow Security
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-normal mb-6">
                    Zero financial risk. Funds are safely held in Stripe escrow and automatically released per approved milestone.
                  </p>
                </div>
                <div className="pt-4 border-t border-neutral-200/60 flex items-center justify-between font-mono text-[11px] font-bold text-emerald-600">
                  <span>&euro;0 Risk &middot; Milestone Payouts</span>
                  <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>

              {/* Feature 3: Dutch Law Contracts -> /about */}
              <Link
                href="/about"
                className="group p-6 rounded-2xl bg-[#fafafb] border border-neutral-200/80 hover:border-orange-400 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-200/80 flex items-center justify-center text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-all duration-300 shadow-sm">
                      <FileCheck size={22} />
                    </div>
                    <span className="font-mono text-[10px] uppercase font-bold text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200 group-hover:bg-orange-600 group-hover:text-white transition-all flex items-center gap-1">
                      Dutch Law Info &rarr;
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-neutral-900 mb-2 uppercase tracking-wide group-hover:text-orange-600 transition-colors">
                    Dutch Law Contracts
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-normal mb-6">
                    Automated, digitally signed contracts compliant with Netherlands freelancing and IP governance rules.
                  </p>
                </div>
                <div className="pt-4 border-t border-neutral-200/60 flex items-center justify-between font-mono text-[11px] font-bold text-neutral-700 group-hover:text-orange-600">
                  <span>Digital Instant Sign</span>
                  <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>

            </div>

          </div>
        </div>

        {/* Primary Platform Stats strip (Interactive Clickable Links with Hover Animations) */}
        <div className="mt-16 border-t border-neutral-200/80 pt-12 max-w-4xl mx-auto grid grid-cols-3 gap-6 md:gap-12">
          {[
            { value: stats.openTasks, label: "Open Tasks Now", href: "/tasks" },
            { value: `${stats.students}+`, label: "Verified Students", href: "/register?role=student" },
            { value: `${stats.enterprises}+`, label: "Companies Onboard", href: "/register?role=enterprise" },
          ].map((s) => (
            <Link
              key={s.label}
              href={s.href}
              className="text-center group p-4 rounded-2xl border border-transparent hover:border-orange-300 hover:bg-orange-50/50 hover:-translate-y-1 hover:shadow-md transition-all duration-300 cursor-pointer"
            >
              <div className="text-3xl sm:text-4xl md:text-5xl font-black text-neutral-900 tracking-tight group-hover:text-orange-600 transition-colors">
                {s.value}
              </div>
              <div className="text-[10px] sm:text-xs text-orange-600 uppercase tracking-[0.2em] font-mono mt-2 font-bold group-hover:underline flex items-center justify-center gap-1">
                <span>{s.label}</span>
                <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── 2. HOW IT WORKS SECTION (Single-View Luxury Bento Architecture) ── */}
      <section id="how-it-works" className="bg-[#f5f5f7] py-12 md:py-14 px-4 md:px-8 border-y border-neutral-200/80 relative">
        <div className="max-w-6xl mx-auto">

          <div className="mb-8 text-center">
            <div className="text-[11px] font-mono tracking-[0.3em] uppercase font-bold text-orange-600 mb-2">
              ENGINEERED SIMPLICITY
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-[#111827] uppercase">
              REFINED FOR ENTERPRISES. BUILT FOR TALENT.
            </h2>
            <p className="text-neutral-600 mt-2 max-w-2xl mx-auto text-xs sm:text-sm leading-relaxed font-normal">
              Companies access verified university talent without friction. Students perform contracted work with guaranteed escrow payouts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">

            {/* For Companies */}
            <div className="bg-white rounded-2xl p-6 md:p-7 border border-neutral-200/80 shadow-sm relative overflow-hidden group hover:border-orange-400 hover:shadow-md transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between mb-5 border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                  <h3 className="text-base font-bold uppercase tracking-wider text-neutral-900">For Companies</h3>
                </div>
                <span className="font-mono text-[10px] uppercase font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200/60">
                  4-Step Workflow
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {[
                  { n: "01", title: "Commission a Task", desc: "Define precise deliverables, deadline, language requirements & budget.", href: "/register?role=enterprise" },
                  { n: "02", title: "Review Vetted Talent", desc: "Inspect domain-verified university candidates with academic proof.", href: "/tasks" },
                  { n: "03", title: "Escrow & Digital Contract", desc: "Dutch legal contract signed & funds safely locked in Stripe escrow.", href: "#how-it-works" },
                  { n: "04", title: "Milestone Release", desc: "Inspect & approve deliverables to release funds directly to student.", href: "/tasks" },
                ].map((step) => (
                  <Link
                    key={step.n}
                    href={step.href}
                    className="group/step flex items-start gap-3.5 p-3.5 rounded-xl bg-[#fafafb] border border-neutral-200/80 hover:border-orange-400 hover:bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
                  >
                    <div className="font-mono text-xs font-black text-orange-600 bg-orange-50 px-2 py-1 rounded-lg border border-orange-200/60 group-hover/step:bg-orange-600 group-hover/step:text-white transition-all flex-shrink-0">
                      {step.n}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-neutral-900 uppercase tracking-wide group-hover/step:text-orange-600 transition-colors mb-0.5 flex items-center justify-between">
                        <span>{step.title}</span>
                        <ChevronRight size={12} className="opacity-0 group-hover/step:opacity-100 group-hover/step:translate-x-1 transition-all text-orange-600" />
                      </div>
                      <div className="text-[11px] text-neutral-600 leading-relaxed font-normal">
                        {step.desc}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* For Students */}
            <div className="bg-white rounded-2xl p-6 md:p-7 border border-neutral-200/80 shadow-sm relative overflow-hidden group hover:border-emerald-500/50 hover:shadow-md transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between mb-5 border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                  <h3 className="text-base font-bold uppercase tracking-wider text-neutral-900">For Students</h3>
                </div>
                <span className="font-mono text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                  Guaranteed Escrow
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {[
                  { n: "01", title: "Verify Academic Status", desc: "Authenticate with your official Dutch university email domain.", href: "/register?role=student" },
                  { n: "02", title: "Apply to Luxury Briefs", desc: "Select high-impact tasks matching your skills & submit proposals.", href: "/tasks" },
                  { n: "03", title: "Contractual Protection", desc: "Perform work backed by Dutch law terms & capital reserved in escrow.", href: "#how-it-works" },
                  { n: "04", title: "Direct Bank Payouts", desc: "Submit work deliverables per milestone & receive funds directly.", href: "/register?role=student" },
                ].map((step) => (
                  <Link
                    key={step.n}
                    href={step.href}
                    className="group/step flex items-start gap-3.5 p-3.5 rounded-xl bg-[#fafafb] border border-neutral-200/80 hover:border-emerald-400 hover:bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
                  >
                    <div className="font-mono text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200/60 group-hover/step:bg-emerald-600 group-hover/step:text-white transition-all flex-shrink-0">
                      {step.n}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-neutral-900 uppercase tracking-wide group-hover/step:text-emerald-600 transition-colors mb-0.5 flex items-center justify-between">
                        <span>{step.title}</span>
                        <ChevronRight size={12} className="opacity-0 group-hover/step:opacity-100 group-hover/step:translate-x-1 transition-all text-emerald-600" />
                      </div>
                      <div className="text-[11px] text-neutral-600 leading-relaxed font-normal">
                        {step.desc}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 3. TRUST & GUARANTEE SECTION (Generous Eye-Relaxing Whitespace & Section 2 Card Effects) ── */}
      <section className="pt-28 pb-28 md:pt-36 md:pb-36 px-4 md:px-8 max-w-6xl mx-auto">
        <div className="mb-14 text-center">
          <div className="text-[11px] font-mono tracking-[0.3em] uppercase font-bold text-orange-600 mb-2.5">
            INSTITUTIONAL TRUST
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-[#111827] uppercase">
            BUILT ON UNCOMPROMISING SECURITY.
          </h2>
          <p className="text-neutral-600 mt-3 max-w-xl mx-auto text-xs sm:text-sm leading-relaxed font-normal">
            Every student verified by academic domain. Every euro locked in Stripe escrow. Every deliverable protected under Dutch law.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">

          {/* Card 1 */}
          <Link
            href="/register?role=student"
            className="bg-white rounded-2xl p-7 md:p-8 border border-neutral-200/80 shadow-sm relative overflow-hidden group hover:border-orange-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-bl-full pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-6 border-b border-neutral-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                  <h3 className="text-base font-bold uppercase tracking-wider text-neutral-900 group-hover:text-orange-600 transition-colors">University Verified</h3>
                </div>
                <span className="font-mono text-[10px] uppercase font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200/60 group-hover:bg-orange-600 group-hover:text-white transition-all">
                  Domain Check &rarr;
                </span>
              </div>

              <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-200/80 flex items-center justify-center mb-5 text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-all duration-300 shadow-sm">
                <GraduationCap size={22} />
              </div>

              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-normal mb-6">
                Strict domain authentication against official Dutch university registries (TU Delft, UvA, TU/e, EUR) before any student can apply.
              </p>
            </div>

            <div className="pt-4 border-t border-neutral-100 flex items-center gap-2 font-mono text-[11px] font-bold text-orange-600">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span>TU Delft &middot; UvA &middot; EUR Domain Check</span>
            </div>
          </Link>

          {/* Card 2 */}
          <Link
            href="/register?role=enterprise"
            className="bg-white rounded-2xl p-7 md:p-8 border border-neutral-200/80 shadow-sm relative overflow-hidden group hover:border-emerald-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-6 border-b border-neutral-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                  <h3 className="text-base font-bold uppercase tracking-wider text-neutral-900 group-hover:text-emerald-600 transition-colors">Stripe Escrow</h3>
                </div>
                <span className="font-mono text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  Escrow Engine &rarr;
                </span>
              </div>

              <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-200/80 flex items-center justify-center mb-5 text-orange-600 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-sm">
                <ShieldCheck size={22} />
              </div>

              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-normal mb-6">
                Capital is reserved upfront before work initiates. Payment releases automatically to the student only upon verified deliverable approval.
              </p>
            </div>

            <div className="pt-4 border-t border-neutral-100 flex items-center gap-2 font-mono text-[11px] font-bold text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>&euro;0 Financial Risk &middot; Escrow Lock</span>
            </div>
          </Link>

          {/* Card 3 */}
          <Link
            href="#how-it-works"
            className="bg-white rounded-2xl p-7 md:p-8 border border-neutral-200/80 shadow-sm relative overflow-hidden group hover:border-orange-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-bl-full pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-6 border-b border-neutral-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-neutral-900" />
                  <h3 className="text-base font-bold uppercase tracking-wider text-neutral-900 group-hover:text-orange-600 transition-colors">Dutch Contracts</h3>
                </div>
                <span className="font-mono text-[10px] uppercase font-bold text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200 group-hover:bg-orange-600 group-hover:text-white transition-all">
                  Dutch Law &rarr;
                </span>
              </div>

              <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-200/80 flex items-center justify-center mb-5 text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-all duration-300 shadow-sm">
                <FileCheck size={22} />
              </div>

              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-normal mb-6">
                Auto-generated legally binding contracts signed digitally with instant legal enforcement across Netherlands IP and freelancing jurisdictions.
              </p>
            </div>

            <div className="pt-4 border-t border-neutral-100 flex items-center gap-2 font-mono text-[11px] font-bold text-neutral-700">
              <span className="w-2 h-2 rounded-full bg-neutral-400" />
              <span>Instant Digital Signatures</span>
            </div>
          </Link>

        </div>
      </section>

      {/* ── 4. PLATFORM STATS GRID SECTION (Interactive Clickable Cards) ── */}
      <section className="py-16 bg-[#f5f5f7] border-y border-neutral-200/80 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-white border border-neutral-200/80 rounded-2xl overflow-hidden p-6 md:p-8 shadow-sm">
            {[
              { value: `${stats.openTasks}+`, label: "Open Tasks", sub: "Active Right Now", href: "/tasks" },
              { value: `${stats.students}+`, label: "Verified Students", sub: "Across 12 Universities", href: "/register?role=student" },
              { value: `${stats.enterprises}+`, label: "Companies Onboard", sub: "KVK Validated", href: "/register?role=enterprise" },
              { value: stats.totalPaidOut > 0 ? centsToEur(stats.totalPaidOut) : "€0", label: "Escrow Paid Out", sub: "Guaranteed Transfers", href: "#how-it-works" },
            ].map((s) => (
              <Link
                key={s.label}
                href={s.href}
                className="p-4 flex flex-col justify-between border-r border-neutral-100 last:border-r-0 group hover:bg-orange-50/50 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 cursor-pointer rounded-xl"
              >
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight group-hover:text-orange-600 transition-colors">{s.value}</div>
                  <div className="text-xs font-bold text-orange-600 uppercase tracking-wider mt-1 flex items-center justify-between">
                    <span>{s.label}</span>
                    <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-orange-600" />
                  </div>
                </div>
                <div className="text-[11px] font-mono text-neutral-500 mt-3 group-hover:text-neutral-900 font-medium">{s.sub}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. OPEN TASKS SECTION (Matching Section 1 & 2 Luxury Design Philosophy) ── */}
      {tasks.length > 0 && (
        <section className="pt-24 pb-28 md:pt-32 md:pb-36 px-4 md:px-8 max-w-6xl mx-auto">

          {/* Centered Luxury Header */}
          <div className="mb-14 text-center">
            <div className="text-[11px] font-mono tracking-[0.3em] uppercase font-bold text-orange-600 mb-2.5">
              CURATED BRIEFS
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-[#111827] uppercase">
              FEATURED OPEN TASKS
            </h2>
            <p className="text-neutral-600 mt-3 max-w-xl mx-auto text-xs sm:text-sm leading-relaxed font-normal">
              Commissioned by top Dutch enterprises with reserved Stripe escrow funding and digital legal contracts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {tasks.map((task) => (
              <Link
                key={task.id}
                href={`/tasks/${task.id}`}
                className="bg-white rounded-2xl p-7 md:p-8 border border-neutral-200/80 shadow-sm relative overflow-hidden group hover:border-orange-400 hover:shadow-xl hover:-translate-y-1.5 active:scale-[0.99] transition-all duration-300 flex flex-col justify-between cursor-pointer"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-bl-full pointer-events-none" />

                <div>
                  <div className="flex items-center justify-between mb-5 border-b border-neutral-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                      <span className="text-[10px] uppercase tracking-widest font-mono font-bold text-neutral-900 group-hover:text-orange-600 transition-colors">
                        {task.enterprise?.enterpriseProfile?.companyName ?? "Enterprise Task"}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] uppercase font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200/60 group-hover:bg-orange-600 group-hover:text-white transition-all">
                      OPEN BRIEF
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-neutral-900 line-clamp-2 leading-snug group-hover:text-orange-600 transition-colors mb-3">
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className="text-xs sm:text-sm text-neutral-600 line-clamp-3 leading-relaxed mb-6 font-normal">
                      {task.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-neutral-100 pt-4 mt-auto">
                  <span className="text-base font-mono font-extrabold text-orange-600">{formatBudget(task.budgetCents)}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-neutral-500 flex items-center gap-1 font-mono">
                      <Users size={12} /> {task._count.applications}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-neutral-900 group-hover:text-orange-600 transition-colors">
                      APPLY NOW &rarr;
                    </span>
                  </div>
                </div>
              </Link>
            ))}

            {/* Symmetric Filler Card for 3-Column Grid Balance */}
            {tasks.length % 3 !== 0 && (
              <Link
                href="/register?role=enterprise"
                className="bg-gradient-to-br from-white via-orange-50/30 to-amber-50/40 rounded-2xl p-7 md:p-8 border border-dashed border-orange-300/80 shadow-sm relative overflow-hidden group hover:border-orange-500 hover:shadow-xl hover:-translate-y-1.5 active:scale-[0.99] transition-all duration-300 flex flex-col justify-between cursor-pointer"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-bl-full pointer-events-none" />

                <div>
                  <div className="flex items-center justify-between mb-5 border-b border-orange-200/50 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
                      <span className="text-[10px] uppercase tracking-widest font-mono font-bold text-orange-700">
                        YOUR ENTERPRISE
                      </span>
                    </div>
                    <span className="font-mono text-[10px] uppercase font-bold text-orange-700 bg-white px-2 py-0.5 rounded border border-orange-300 group-hover:bg-orange-600 group-hover:text-white transition-all">
                      POST BRIEF
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-neutral-900 leading-snug group-hover:text-orange-600 transition-colors mb-3 uppercase tracking-wide">
                    Commission Your Next Brief
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed mb-6 font-normal">
                    Access verified student specialists from TU Delft, UvA, and Erasmus. Protected by Dutch contracts & Stripe escrow.
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-orange-200/60 pt-4 mt-auto">
                  <span className="text-xs font-mono font-bold text-orange-600 uppercase tracking-wider">Custom Budget</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-white bg-orange-600 px-3 py-1.5 rounded-md group-hover:bg-orange-700 transition-colors shadow-sm">
                    COMMISSION TASK &rarr;
                  </span>
                </div>
              </Link>
            )}
          </div>

          {/* View All Roster Button */}
          <div className="mt-12 text-center">
            <Link
              href="/tasks"
              className="inline-flex items-center justify-center rounded-sm bg-white border border-neutral-300 px-8 py-3.5 text-xs uppercase font-bold tracking-[0.15em] text-neutral-800 hover:border-orange-500 hover:text-orange-600 active:scale-95 transition-all shadow-sm"
            >
              Browse Full Roster of Open Tasks &rarr;
            </Link>
          </div>

        </section>
      )}

      {/* ── 6. UNIVERSITY ROSTER SECTION (Fixed Bigger Cards, Arrow Controls, max-w-6xl Width) ── */}
      <section className="py-24 md:py-32 bg-[#fafafb] border-y border-neutral-200/80 my-8">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <UniversityRosterSlider />
        </div>
      </section>

      {/* ── 7. DUAL CTA SECTION (Light Luxury Cards with Orange Accent) ── */}
      <section className="py-24 md:py-32 px-4 md:px-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* For Companies - Luxury Dark Obsidian Card */}
          <div className="bg-[#111827] text-white rounded-2xl p-8 md:p-12 flex flex-col justify-between border border-neutral-800 hover:border-orange-500/60 transition-all shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/10 rounded-bl-full pointer-events-none" />
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                <span className="text-[10px] font-mono tracking-[0.2em] uppercase font-bold text-orange-400">
                  FOR ENTERPRISES
                </span>
              </div>
              <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white mb-4">
                COMMISSION A TASK IN MINUTES.
              </h3>
              <p className="text-sm md:text-base text-neutral-300 leading-relaxed mb-8 max-w-md font-normal">
                Define deliverables, milestones, and budget. Receive verified Dutch student proposals within 24 hours under guaranteed Stripe escrow protection.
              </p>
            </div>
            <Link
              href="/register?role=enterprise"
              className="inline-flex items-center justify-center rounded-sm bg-orange-600 px-6 py-3 text-xs uppercase font-bold tracking-[0.15em] text-white hover:bg-orange-500 active:scale-95 transition-all self-start shadow-[0_4px_15px_rgba(249,115,22,0.3)]"
            >
              Post a task <ChevronRight size={14} className="ml-1" />
            </Link>
          </div>

          {/* For Students - Luxury Light Gray Card */}
          <div className="bg-[#f5f5f7] text-neutral-900 rounded-2xl p-8 md:p-12 flex flex-col justify-between border border-neutral-200/80 hover:border-orange-400 transition-all shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/5 rounded-bl-full pointer-events-none" />
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-mono tracking-[0.2em] uppercase font-bold text-emerald-700">
                  FOR TALENT
                </span>
              </div>
              <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-neutral-900 mb-4">
                EXECUTE HIGH-CALIBER WORK.
              </h3>
              <p className="text-sm md:text-base text-neutral-600 leading-relaxed mb-8 max-w-md font-normal">
                Browse verified corporate task briefs. Apply with your university credentials, execute with contractual backing, and get paid per milestone.
              </p>
            </div>
            <Link
              href="/register?role=student"
              className="inline-flex items-center justify-center rounded-sm bg-neutral-900 px-6 py-3 text-xs uppercase font-bold tracking-[0.15em] text-white hover:bg-orange-600 active:scale-95 transition-all self-start"
            >
              Create Student Account <ChevronRight size={14} className="ml-1" />
            </Link>
          </div>

        </div>
      </section>

    </div>
  );
}
