/**
 * src/app/admin/tasks/page.tsx
 *
 * Admin Task Briefs Management Center.
 * Inspect, moderate, filter, and audit task briefs across all categories from live database.
 */

import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { centsToEur, timeAgo } from "@/lib/utils";
import {
  Search,
  ArrowLeft,
  Users,
  Eye,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = { title: "Manage Tasks — Admin Panel" };

export default async function AdminTasksPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/");

  let tasks: any[] = [];
  try {
    tasks = await db.task.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
      include: {
        enterprise: {
          select: {
            email: true,
            enterpriseProfile: { select: { companyName: true } },
          },
        },
        _count: { select: { applications: true } },
      },
    });
  } catch (err: any) {
    console.error("[AdminTasksPage] DB error:", err?.message);
  }

  const openCount = tasks.filter((t) => t.status === "OPEN").length;
  const assignedCount = tasks.filter((t) => t.status === "ASSIGNED" || t.status === "IN_PROGRESS").length;
  const disputedCount = tasks.filter((t) => t.status === "DISPUTED").length;

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
            <div className="text-[11px] font-mono tracking-[0.25em] uppercase font-bold text-orange-600 mb-1">
              TASK MODERATION & BRIEF ENGINE
            </div>
            <h1 className="text-3xl font-black uppercase text-neutral-900 tracking-tight">
              Manage Tasks ({tasks.length})
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold bg-white border border-neutral-200 px-3 py-1.5 rounded-md text-neutral-700 shadow-sm">
              Open Briefs: <strong className="text-emerald-600">{openCount}</strong>
            </span>
            <span className="text-xs font-mono font-bold bg-white border border-neutral-200 px-3 py-1.5 rounded-md text-neutral-700 shadow-sm">
              Active Contracts: <strong className="text-blue-600">{assignedCount}</strong>
            </span>
            <span className="text-xs font-mono font-bold bg-white border border-neutral-200 px-3 py-1.5 rounded-md text-neutral-700 shadow-sm">
              Disputed: <strong className="text-red-600">{disputedCount}</strong>
            </span>
          </div>
        </div>

        {/* Tasks Table */}
        <div className="bg-white border border-neutral-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-neutral-100 bg-[#fafafb] flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search brief by title, enterprise, or category..."
                className="w-full pl-9 pr-4 py-2 text-xs font-mono bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-100 bg-[#fafafb] text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold">
                  <th className="py-3.5 px-5">Brief Details</th>
                  <th className="py-3.5 px-4">Enterprise</th>
                  <th className="py-3.5 px-4">Budget</th>
                  <th className="py-3.5 px-4">Applicants</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Created</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-xs font-mono">
                {tasks.length > 0 ? (
                  tasks.map((t) => (
                    <tr key={t.id} className="hover:bg-orange-50/30 transition-colors group">
                      <td className="py-4 px-5 max-w-xs">
                        <p className="font-bold text-neutral-900 group-hover:text-orange-600 transition-colors line-clamp-1">{t.title}</p>
                        <span className="inline-block mt-0.5 text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200/60 uppercase">
                          {t.category}
                        </span>
                      </td>

                      <td className="py-4 px-4 font-bold text-neutral-800">
                        {t.enterprise?.enterpriseProfile?.companyName ?? t.enterprise?.email ?? "Enterprise"}
                      </td>

                      <td className="py-4 px-4 font-black text-orange-600">
                        {centsToEur(t.budgetCents)}
                      </td>

                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1 font-bold text-neutral-700">
                          <Users className="h-3.5 w-3.5 text-neutral-400" /> {t._count?.applications ?? 0}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          t.status === "OPEN"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : t.status === "DISPUTED"
                            ? "bg-red-100 text-red-800 border border-red-200"
                            : t.status === "COMPLETED"
                            ? "bg-blue-100 text-blue-800 border border-blue-200"
                            : "bg-amber-100 text-amber-800 border border-amber-200"
                        }`}>
                          {t.status}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-neutral-500">
                        {timeAgo(t.createdAt)}
                      </td>

                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/tasks/${t.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded border border-neutral-200 bg-white text-neutral-700 hover:border-orange-500 hover:text-orange-600 transition-all"
                          >
                            <Eye className="h-3 w-3" /> Inspect
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-neutral-400">
                      No tasks found in database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
