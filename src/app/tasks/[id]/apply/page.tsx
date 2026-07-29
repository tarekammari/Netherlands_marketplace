/**
 * src/app/tasks/[id]/apply/page.tsx
 *
 * Page for students to apply to an open task.
 * Feeds task details into the client ApplyForm.
 */

import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ApplyForm } from "@/components/tasks/apply-form";
import { centsToEur, formatDate, CATEGORY_LABELS } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar, Euro } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const task = await db.task.findUnique({ where: { id } });
  if (!task) return { title: "Task Not Found" };
  return { title: `Apply to: ${task.title}` };
}

export default async function ApplyPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();

  // Guard: User must be authenticated and be a student
  if (!session?.user) {
    redirect(`/login?callbackUrl=/tasks/${id}/apply`);
  }
  if (session.user.role !== "STUDENT") {
    redirect("/tasks");
  }

  // Load task detail
  const task = await db.task.findUnique({
    where: { id },
    include: {
      enterprise: {
        select: {
          enterpriseProfile: { select: { companyName: true } },
        },
      },
    },
  });

  if (!task) notFound();

  // If task not open, redirect back to task details
  if (task.status !== "OPEN") {
    redirect(`/tasks/${id}`);
  }

  const companyName = task.enterprise?.enterpriseProfile?.companyName ?? "Enterprise Client";

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="space-y-6">
        
        {/* Navigation / Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight">
            Apply for this task
          </h1>
          <p className="text-neutral-500 mt-1.5 text-sm leading-relaxed">
            Submit your pitch to the enterprise client. You can negotiate the budget and timeline.
          </p>
        </div>

        {/* Task Brief Card */}
        <div className="bg-[#f5f5f7] rounded-2xl p-6 border border-neutral-200/50 space-y-4">
          <div className="flex justify-between items-start gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">
                Outsourced by {companyName}
              </span>
              <h2 className="text-lg font-bold text-neutral-900 mt-0.5">{task.title}</h2>
            </div>
            <Badge variant="primary">{CATEGORY_LABELS[task.category]}</Badge>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-neutral-200/80 pt-4 text-xs text-neutral-500">
            <span className="flex items-center gap-1.5 font-semibold text-neutral-800">
              <Euro className="h-3.5 w-3.5 text-neutral-600" />
              {centsToEur(task.budgetCents)}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Due: {formatDate(task.deadline)}
            </span>
            <span className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              {companyName}
            </span>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 sm:p-8">
          <ApplyForm taskId={task.id} defaultBudgetEur={task.budgetCents / 100} />
        </div>

      </div>
    </div>
  );
}
