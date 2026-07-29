/**
 * src/app/admin/page.tsx
 *
 * Admin panel overview — shows platform-wide metrics.
 * Protected by middleware (ADMIN role required).
 */

import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { centsToEur, timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin Panel" };

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/");

  const [
    userCount,
    taskCount,
    openDisputeCount,
    recentPayments,
    recentUsers,
    platformRevenue,
  ] = await Promise.all([
    db.user.count(),
    db.task.count(),
    db.task.count({ where: { status: "DISPUTED" } }),
    db.payment.findMany({
      orderBy: { createdAt: "desc" },
      take:    8,
      include: { task: { select: { title: true } } },
    }),
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take:    8,
      select:  { id: true, email: true, role: true, createdAt: true, isVerified: true, isBanned: true },
    }),
    db.payment.aggregate({
      where: { status: "RELEASED" },
      _sum:  { platformFeeCents: true },
    }),
  ]);

  const metrics = [
    { label: "Total users",      value: userCount.toString(),      color: "text-brand-700" },
    { label: "Total tasks",      value: taskCount.toString(),       color: "text-violet-700" },
    { label: "Open disputes",    value: openDisputeCount.toString(),color: "text-red-700" },
    { label: "Platform revenue", value: centsToEur(platformRevenue._sum.platformFeeCents ?? 0), color: "text-green-700" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Admin Panel</h1>
        <p className="text-neutral-500 text-sm mt-1">Platform overview and management</p>
      </div>

      {/* Dispute alert */}
      {openDisputeCount > 0 && (
        <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-5 py-4 flex items-center justify-between">
          <p className="text-sm font-medium text-red-800">
            ⚠️ {openDisputeCount} open {openDisputeCount === 1 ? "dispute" : "disputes"} require attention
          </p>
          <Button size="sm" variant="outline" asChild>
            <Link href="/admin/disputes">View disputes</Link>
          </Button>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metrics.map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="pt-5 pb-5">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-neutral-500 mt-1">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent payments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Payments</CardTitle>
              <Button size="sm" variant="ghost" asChild>
                <Link href="/admin/payments">View all</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-neutral-100">
              {recentPayments.map((p) => (
                <div key={p.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">{p.task.title}</p>
                    <p className="text-xs text-neutral-400">{timeAgo(p.createdAt)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-neutral-900">{centsToEur(p.totalAmountCents)}</p>
                    <Badge variant={p.status === "RELEASED" ? "success" : p.status === "DISPUTED" ? "danger" : "warning"}>
                      {p.status.toLowerCase()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent users */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Users</CardTitle>
              <Button size="sm" variant="ghost" asChild>
                <Link href="/admin/users">View all</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-neutral-100">
              {recentUsers.map((u) => (
                <div key={u.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">{u.email}</p>
                    <p className="text-xs text-neutral-400">{timeAgo(u.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Badge variant={u.role === "STUDENT" ? "primary" : "info"}>
                      {u.role.toLowerCase()}
                    </Badge>
                    {u.isBanned && <Badge variant="danger">banned</Badge>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick links */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: "/admin/users",    label: "Manage Users" },
          { href: "/admin/tasks",    label: "Manage Tasks" },
          { href: "/admin/payments", label: "Payments" },
          { href: "/admin/disputes", label: "Disputes" },
        ].map(({ href, label }) => (
          <Button key={href} variant="outline" className="w-full" asChild>
            <Link href={href}>{label}</Link>
          </Button>
        ))}
      </div>
    </div>
  );
}
