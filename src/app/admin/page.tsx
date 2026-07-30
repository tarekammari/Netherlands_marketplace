/**
 * src/app/admin/page.tsx
 *
 * Admin panel overview — shows real platform-wide metrics directly from database.
 * Protected by middleware (ADMIN role required).
 */

import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { centsToEur, timeAgo } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";
import { AdminKeyGeneratorButton } from "@/components/admin/key-generator-modal";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = { title: "Admin Panel — Overview" };

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login?callbackUrl=/admin");

  let userCount = 0;
  let taskCount = 0;
  let openDisputeCount = 0;
  let recentPayments: any[] = [];
  let recentUsers: any[] = [];
  let totalRevenueCents = 0;

  try {
    const [
      uCount,
      tCount,
      dispCount,
      payments,
      users,
      revenue,
    ] = await Promise.all([
      db.user.count(),
      db.task.count(),
      db.task.count({ where: { status: "DISPUTED" } }),
      db.payment.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { task: { select: { title: true } } },
      }),
      db.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { id: true, email: true, role: true, createdAt: true, isVerified: true, isBanned: true },
      }),
      db.payment.aggregate({
        where: { status: "RELEASED" },
        _sum: { platformFeeCents: true },
      }),
    ]);

    userCount = uCount;
    taskCount = tCount;
    openDisputeCount = dispCount;
    recentPayments = payments;
    recentUsers = users;
    totalRevenueCents = revenue._sum.platformFeeCents ?? 0;
  } catch (err: any) {
    console.error("[AdminPage] DB query error:", err?.message);
  }

  const metrics = [
    { label: "Total users",      value: userCount.toLocaleString(), color: "text-[#111827]" },
    { label: "Total tasks",      value: taskCount.toLocaleString(), color: "text-orange-600" },
    { label: "Open disputes",    value: openDisputeCount.toString(), color: "text-red-600" },
    { label: "Platform revenue", value: centsToEur(totalRevenueCents), color: "text-emerald-600" },
  ];

  return (
    <div className="min-h-screen bg-[#fafafb] py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Page Header & Top Navigation Button Bar */}
        <div className="mb-8 flex flex-col xl:flex-row xl:items-center justify-between gap-6 border-b border-neutral-200 pb-6">
          <div>
            <div className="text-[11px] font-mono tracking-[0.25em] uppercase font-bold text-orange-600 mb-1">
              PLATFORM OVERVIEW & CONTROL CENTER
            </div>
            <h1 className="text-3xl font-black uppercase text-neutral-900 tracking-tight">
              Admin Overview
            </h1>
          </div>

          {/* Top Primary Page Navigation Buttons & Key Generator */}
          <div className="flex flex-wrap items-center gap-2.5 font-mono">
            {/* 🔑 EMPHASIZED SECURITY KEY GENERATOR BUTTON */}
            <AdminKeyGeneratorButton />

            {[
              { href: "/admin/users",    label: "👥 Manage Users" },
              { href: "/admin/tasks",    label: "💼 Manage Tasks" },
              { href: "/admin/payments", label: "💳 Payments" },
              { href: "/admin/disputes", label: "⚖️ Disputes" },
              { href: "/admin/settings", label: "⚙️ System Settings" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider rounded-xl border border-neutral-200 bg-white text-neutral-800 hover:border-orange-500 hover:text-orange-600 shadow-sm transition-all hover:-translate-y-0.5"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Dispute Alert Banner */}
        {openDisputeCount > 0 && (
          <div className="mb-8 rounded-2xl bg-red-50 border border-red-200 p-5 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <p className="text-sm font-mono font-bold text-red-800">
                ⚠️ {openDisputeCount} open {openDisputeCount === 1 ? "dispute requires" : "disputes require"} legal arbitration
              </p>
            </div>
            <Link
              href="/admin/disputes"
              className="px-3 py-1.5 bg-red-600 text-white text-xs font-mono font-bold uppercase tracking-wider rounded-lg hover:bg-red-700 transition-all shadow-sm"
            >
              Arbitrate Disputes &rarr;
            </Link>
          </div>
        )}

        {/* Top 4 Summary Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 font-mono">
          {metrics.map(({ label, value, color }) => (
            <div key={label} className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-sm">
              <span className="text-[11px] font-mono font-bold text-neutral-400 uppercase tracking-wider">{label}</span>
              <p className={`text-3xl font-black tracking-tight mt-1 ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Overview Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Recent Payments */}
          <div className="bg-white border border-neutral-200/80 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-neutral-100 bg-[#fafafb] flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-900">
                Recent Escrow Transactions
              </h3>
              <Link href="/admin/payments" className="text-xs font-mono font-bold text-orange-600 hover:underline">
                View All &rarr;
              </Link>
            </div>
            <div className="p-5 divide-y divide-neutral-100 font-mono text-xs">
              {recentPayments.length > 0 ? (
                recentPayments.map((p) => (
                  <div key={p.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-neutral-900 truncate">{p.task?.title ?? "Task Brief"}</p>
                      <p className="text-[10px] text-neutral-400">{timeAgo(p.createdAt)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-black text-neutral-900">{centsToEur(p.totalAmountCents)}</p>
                      <span className={`inline-block mt-0.5 text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                        p.status === "RELEASED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {p.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-neutral-400 py-4 text-center">No transactions recorded yet.</p>
              )}
            </div>
          </div>

          {/* Recent Users */}
          <div className="bg-white border border-neutral-200/80 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-neutral-100 bg-[#fafafb] flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-900">
                Recent Registered Accounts
              </h3>
              <Link href="/admin/users" className="text-xs font-mono font-bold text-orange-600 hover:underline">
                View All &rarr;
              </Link>
            </div>
            <div className="p-5 divide-y divide-neutral-100 font-mono text-xs">
              {recentUsers.length > 0 ? (
                recentUsers.map((u) => (
                  <div key={u.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-neutral-900 truncate">{u.email}</p>
                      <p className="text-[10px] text-neutral-400">{timeAgo(u.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                        u.role === "ADMIN" ? "bg-purple-100 text-purple-800" : u.role === "ENTERPRISE" ? "bg-blue-100 text-blue-800" : "bg-emerald-100 text-emerald-800"
                      }`}>
                        {u.role}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-neutral-400 py-4 text-center">No user accounts found.</p>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
