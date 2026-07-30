/**
 * src/app/about/page.tsx
 *
 * About TaskBridge NL — Production Level Public Information Page.
 * Showcases mission, academic partnership model, Dutch legal compliance,
 * and key operational metrics.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { AdminImageEditable } from "@/components/admin/admin-image-editable";
import { AmsterdamMap } from "@/components/common/amsterdam-map";
import {
  ShieldCheck,
  GraduationCap,
  Building2,
  Lock,
  CheckCircle2,
  ArrowRight,
  Award,
  Globe,
  Users,
  Scale,
  Zap,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "About Us — TaskBridge NL",
  description:
    "Learn how TaskBridge NL connects verified Dutch university students from TU Delft, UvA, TU/e, and Erasmus with corporate enterprises for short-term professional tasks.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#fafafb] text-neutral-900 py-12 md:py-20 font-sans">
      <div className="max-w-6xl mx-auto px-4 md:px-8 space-y-16">
        
        {/* Hero Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200/80 text-orange-600 font-mono text-[11px] font-bold tracking-widest uppercase shadow-sm">
            <Globe className="h-3.5 w-3.5" /> DUTCH ENGINEERING & ACADEMIC TALENT
          </div>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-neutral-900 leading-tight">
            BRIDGING DUTCH ENTERPRISES & UNIVERSITY EXCELLENCE
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 font-mono leading-relaxed">
            TaskBridge NL is the premier Netherlands marketplace designed to connect corporate enterprises with top 5% academic talent from Dutch research universities.
          </p>
        </div>

        {/* Hero Visual Image Banner with Admin Inline Device Upload */}
        <AdminImageEditable
          settingKey="ABOUT_HERO_IMAGE"
          defaultSrc="/api/about-image"
          alt="Dutch Technology & Academic Workspace Amsterdam"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/20 to-transparent flex items-end p-6 sm:p-10 pointer-events-none">
            <div>
              <span className="text-[10px] font-mono font-bold text-orange-400 uppercase tracking-widest block">
                AMSTERDAM INNOVATION CAMPUS
              </span>
              <p className="text-white font-mono text-sm sm:text-lg font-black uppercase tracking-tight mt-1">
                🇳🇱 Connecting Dutch Enterprise Leaders & University Engineers
              </p>
            </div>
          </div>
        </AdminImageEditable>

        {/* 4 Core Pillars Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-sm hover:border-orange-300 transition-all">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">Student Payouts</span>
            <p className="text-3xl font-black text-emerald-600 mt-1">€4.5M+</p>
            <span className="text-[10px] text-neutral-500 mt-1 block">Transferred via SEPA Express</span>
          </div>

          <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-sm hover:border-orange-300 transition-all">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">Partner Enterprises</span>
            <p className="text-3xl font-black text-neutral-900 mt-1">142+</p>
            <span className="text-[10px] text-neutral-500 mt-1 block">Verified KVK Companies</span>
          </div>

          <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-sm hover:border-orange-300 transition-all">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">Escrow Security</span>
            <p className="text-3xl font-black text-orange-600 mt-1">100%</p>
            <span className="text-[10px] text-neutral-500 mt-1 block">Stripe Vault Protected</span>
          </div>

          <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-sm hover:border-orange-300 transition-all">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">Legal Compliance</span>
            <p className="text-3xl font-black text-purple-600 mt-1">Dutch IP</p>
            <span className="text-[10px] text-neutral-500 mt-1 block">Pre-signed Freelance PDF</span>
          </div>
        </div>

        {/* Mission & Story Section */}
        <div className="bg-white border border-neutral-200/80 rounded-3xl p-8 md:p-12 shadow-sm grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-orange-600 flex items-center gap-2">
              <Award className="h-4 w-4" /> OUR MISSION
            </div>
            <h2 className="text-2xl sm:text-3xl font-black uppercase text-neutral-900 tracking-tight leading-tight">
              EMPPOWERING STUDENTS WITH REAL-WORLD TASKS
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-sans">
              Traditional student employment often limits students to low-skill jobs. Meanwhile, Dutch startups, SaaS companies, and logistics firms urgently require specialized help in research, software development, data analysis, UI/UX design, and legal/financial drafting.
            </p>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-sans">
              TaskBridge NL solves this gap by creating a secure, milestone-gated marketplace where enterprises post project briefs and students earn competitive professional rates.
            </p>
          </div>

          <div className="space-y-4 bg-[#fafafb] p-6 sm:p-8 rounded-2xl border border-neutral-200/80 font-mono text-xs">
            <h3 className="font-bold text-neutral-900 uppercase tracking-wider text-sm border-b border-neutral-200 pb-3">
              Academic Talent Network:
            </h3>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs">
                  TUD
                </div>
                <div>
                  <p className="font-bold text-neutral-900">Delft University of Technology (TU Delft)</p>
                  <p className="text-[10px] text-neutral-500">Engineering, Robotics & Computer Science</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                  UvA
                </div>
                <div>
                  <p className="font-bold text-neutral-900">University of Amsterdam (UvA)</p>
                  <p className="text-[10px] text-neutral-500">Data Science, AI & Financial Economics</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs">
                  TUE
                </div>
                <div>
                  <p className="font-bold text-neutral-900">Eindhoven University of Technology (TU/e)</p>
                  <p className="text-[10px] text-neutral-500">Industrial Design & Embedded Systems</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">
                  EUR
                </div>
                <div>
                  <p className="font-bold text-neutral-900">Erasmus University Rotterdam</p>
                  <p className="text-[10px] text-neutral-500">Law, Finance & Supply Chain Logistics</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Amsterdam Map Localization Section */}
        <AmsterdamMap />

        {/* 3 Key Pillars of Trust */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 border border-orange-200/60 flex items-center justify-center">
              <Lock className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 uppercase tracking-wide">Stripe Escrow Vault</h3>
            <p className="text-xs text-neutral-600 leading-relaxed font-sans">
              Enterprises pre-authorize milestone funds prior to work start. Capital is safely held in Stripe Escrow and only released upon milestone approval.
            </p>
          </div>

          <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center">
              <Scale className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 uppercase tracking-wide">Dutch Legal Contracts</h3>
            <p className="text-xs text-neutral-600 leading-relaxed font-sans">
              Every task automatically generates a legally binding freelance agreement under Netherlands IP law, ensuring clear ownership of all deliverables.
            </p>
          </div>

          <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 uppercase tracking-wide">Instant SEPA Payouts</h3>
            <p className="text-xs text-neutral-600 leading-relaxed font-sans">
              Approved milestones trigger instant SEPA Express payouts directly to Dutch IBAN bank accounts with zero transfer delays.
            </p>
          </div>
        </div>

        {/* CTA Footer Card */}
        <div className="bg-neutral-900 text-white rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-xl relative overflow-hidden font-mono">
          <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight">
            READY TO POWER YOUR NEXT PROJECT?
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-xl mx-auto">
            Post a task brief in less than 3 minutes or browse open opportunities across the Netherlands.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/register?role=ENTERPRISE"
              className="px-6 py-3 rounded-xl bg-orange-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-orange-700 transition-all shadow-md"
            >
              Post a Task Brief &rarr;
            </Link>
            <Link
              href="/tasks"
              className="px-6 py-3 rounded-xl border border-neutral-700 bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-700 transition-all"
            >
              Browse Open Tasks
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
