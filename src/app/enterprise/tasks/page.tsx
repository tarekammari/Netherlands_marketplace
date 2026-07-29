/**
 * src/app/enterprise/tasks/page.tsx
 *
 * Enterprise "My Tasks" management page.
 * Lists all tasks posted by the enterprise user with status filters, metrics, and manage links.
 */

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { centsToEur } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EnterpriseTaskList, type EnterpriseTaskItem } from "@/components/enterprise/enterprise-task-list";
import { PlusCircle, Briefcase, Users, Euro, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "My Tasks — TaskBridge Enterprise",
  description: "View and manage all corporate task briefs, applications, and active contracts.",
};

export default async function EnterpriseTasksPage() {
  const session = await auth();

  // Guard: User must be authenticated and be an Enterprise
  if (!session?.user) {
    redirect("/login?callbackUrl=/enterprise/tasks");
  }
  if (session.user.role !== "ENTERPRISE") {
    redirect("/");
  }

  const userId = session.user.id;

  // Fetch all tasks posted by this enterprise
  const tasks = await db.task.findMany({
    where: { enterpriseId: userId },
    include: {
      _count: {
        select: {
          applications: true,
          milestones: true,
        },
      },
      applications: {
        select: {
          id: true,
          status: true,
        },
      },
      milestones: {
        select: {
          id: true,
          status: true,
        },
      },
      contract: {
        select: {
          id: true,
          status: true,
        },
      },
      payment: {
        select: {
          id: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Calculate overview metrics
  const totalTasks = tasks.length;
  const activeTasks = tasks.filter((t) => ["OPEN", "IN_PROGRESS", "ASSIGNED", "IN_REVIEW"].includes(t.status)).length;
  const totalApplications = tasks.reduce((sum, t) => sum + t._count.applications, 0);
  const totalBudgetCents = tasks.reduce((sum, t) => sum + t.budgetCents, 0);

  // Format tasks payload for client list component
  const formattedTasks: EnterpriseTaskItem[] = tasks.map((task) => {
    const pendingApps = task.applications.filter((a) => a.status === "PENDING").length;
    const completedMilestones = task.milestones.filter((m) => m.status === "APPROVED").length;

    return {
      id: task.id,
      title: task.title,
      slug: task.slug,
      category: task.category,
      status: task.status,
      budgetCents: task.budgetCents,
      deadline: task.deadline.toISOString(),
      createdAt: task.createdAt.toISOString(),
      skillsRequired: task.skillsRequired,
      applicationsCount: task._count.applications,
      pendingApplicationsCount: pendingApps,
      milestoneCount: task._count.milestones,
      completedMilestonesCount: completedMilestones,
      hasContract: !!task.contract,
      contractStatus: task.contract?.status ?? undefined,
      paymentStatus: task.payment?.status ?? undefined,
    };
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight">
            My Enterprise Tasks
          </h1>
          <p className="text-neutral-500 mt-1 text-sm">
            Overview and management of all task briefs posted by your company.
          </p>
        </div>

        <Button asChild size="lg" className="flex items-center gap-2">
          <Link href="/enterprise/tasks/new">
            <PlusCircle className="h-4 w-4" /> Post a New Task
          </Link>
        </Button>
      </div>

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Posted</span>
            <Briefcase className="h-4 w-4 text-brand-600" />
          </div>
          <p className="text-2xl font-bold text-neutral-900">{totalTasks}</p>
          <p className="text-[11px] text-neutral-400">All task listings</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Pipeline</span>
            <Clock className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-neutral-900">{activeTasks}</p>
          <p className="text-[11px] text-neutral-400">Open or in-progress</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Applications</span>
            <Users className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-neutral-900">{totalApplications}</p>
          <p className="text-[11px] text-neutral-400">Total student proposals</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Value</span>
            <Euro className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-neutral-900">{centsToEur(totalBudgetCents)}</p>
          <p className="text-[11px] text-neutral-400">Across all task budgets</p>
        </div>
      </div>

      {/* ── Main Tasks List & Interactive Filters ── */}
      <EnterpriseTaskList tasks={formattedTasks} />
    </div>
  );
}
