/**
 * src/app/enterprise/tasks/[id]/page.tsx
 *
 * Page for enterprises to manage a single posted task:
 *  - Review and hire applicants.
 *  - View and sign digital contracts.
 *  - Fund Stripe Connect escrow.
 *  - Review submissions and release milestones.
 *  - Chat with the hired student contractor.
 */

import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { centsToEur, formatDate, CATEGORY_LABELS } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { WorkspaceManager } from "@/components/tasks/workspace-manager";
import { Calendar, Euro, FileCheck, Info, Paperclip, FileText } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const task = await db.task.findUnique({ where: { id } });
  if (!task) return { title: "Task Not Found" };
  return { title: `Manage Task: ${task.title}` };
}

export default async function EnterpriseTaskDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();

  // Guard: User must be authenticated and be an enterprise
  if (!session?.user) {
    redirect(`/login?callbackUrl=/enterprise/tasks/${id}`);
  }
  if (session.user.role !== "ENTERPRISE") {
    redirect("/");
  }

  // Load task with all required relations
  const task = await db.task.findUnique({
    where: { id },
    include: {
      contract: true,
      payment: true,
      milestones: { orderBy: { sortOrder: "asc" } },
      applications: {
        include: {
          student: {
            select: {
              id: true,
              email: true,
              nameEncrypted: true,
              avatarUrl: true,
              studentProfile: true,
            },
          },
        },
      },
    },
  });

  if (!task) notFound();

  // Verify ownership
  if (task.enterpriseId !== session.user.id) {
    redirect("/enterprise/dashboard");
  }

  // Load applications list
  const applications = task.applications;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main interactive panel */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Header Row */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="primary">{CATEGORY_LABELS[task.category]}</Badge>
              <Badge variant="outline" className="font-semibold">{task.status}</Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight">
              {task.title}
            </h1>
            
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs sm:text-sm text-neutral-500 pt-2 border-t border-neutral-100">
              <span className="flex items-center gap-1.5 font-semibold text-neutral-800">
                <Euro className="h-4 w-4 text-neutral-600" />
                {centsToEur(task.budgetCents)}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                Final Deadline: {formatDate(task.deadline)}
              </span>
            </div>
          </div>

          {/* Interactive Workspace Manager */}
          <div className="bg-white rounded-[24px] border border-neutral-200 shadow-sm p-6 sm:p-8">
            <WorkspaceManager
              task={task}
              applications={applications}
              contract={task.contract}
              payment={task.payment}
              currentUserId={session.user.id}
            />
          </div>

        </div>

        {/* Sidebar Info Panel */}
        <div className="space-y-6">
          
          {/* Task Specs Recap */}
          <div className="bg-[#f5f5f7] border border-neutral-200/60 rounded-[24px] p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
              <Info size={14} /> Task Specs
            </h3>
            
            <div className="space-y-3 text-sm text-neutral-600">
              <div>
                <span className="font-semibold text-neutral-800">Scope description:</span>
                <p className="mt-1 line-clamp-6 text-xs leading-relaxed text-neutral-500">
                  {task.description}
                </p>
              </div>

              <div>
                <span className="font-semibold text-neutral-800">Deliverables requested:</span>
                <p className="mt-1 text-xs leading-relaxed text-neutral-500 whitespace-pre-line">
                  {task.deliverables}
                </p>
              </div>

              {task.skillsRequired.length > 0 && (
                <div>
                  <span className="font-semibold text-neutral-800">Skills required:</span>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {task.skillsRequired.map((skill: string) => (
                      <Badge key={skill} variant="skill" className="text-[10px]">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {task.attachments && task.attachments.length > 0 && (
                <div>
                  <span className="font-semibold text-neutral-800 flex items-center gap-1">
                    <Paperclip className="h-3.5 w-3.5" /> Attached files ({task.attachments.length}):
                  </span>
                  <div className="space-y-1.5 mt-1.5">
                    {task.attachments.map((attStr: string, i: number) => {
                      let att: { name: string; url: string };
                      try {
                        att = JSON.parse(attStr);
                      } catch {
                        att = { name: `File ${i + 1}`, url: attStr };
                      }
                      return (
                        <a
                          key={i}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-xs text-neutral-700 hover:text-neutral-900 bg-white p-2 rounded-lg border border-neutral-200 truncate"
                        >
                          <FileText className="h-4 w-4 text-neutral-500 flex-shrink-0" />
                          <span className="truncate">{att.name}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Contract Overview Widget */}
          {task.contract && (
            <div className="bg-white border border-neutral-200 rounded-[24px] p-6 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                <FileCheck size={14} /> Digital Contract
              </h3>
              
              <div className="space-y-2.5 text-xs text-neutral-500">
                <div className="flex justify-between">
                  <span>Contract status:</span>
                  <span className="font-semibold text-neutral-800">{task.contract.status}</span>
                </div>
                <div className="flex justify-between">
                  <span>Student signed:</span>
                  <span className={task.contract.studentSignedAt ? "text-emerald-600 font-semibold" : "text-neutral-400"}>
                    {task.contract.studentSignedAt ? formatDate(task.contract.studentSignedAt) : "Pending"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Your signature:</span>
                  <span className={task.contract.enterpriseSignedAt ? "text-emerald-600 font-semibold" : "text-neutral-400"}>
                    {task.contract.enterpriseSignedAt ? formatDate(task.contract.enterpriseSignedAt) : "Pending"}
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
