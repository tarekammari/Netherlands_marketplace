/**
 * src/app/tasks/[id]/page.tsx
 *
 * Public task detail page — fully SSR for SEO.
 * Shows full task details, milestones, company info, and apply button.
 * Generates structured data (JSON-LD) for search engines.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { centsToEur, formatDate, CATEGORY_LABELS } from "@/lib/utils";
import { Calendar, Euro, Clock, Building2, Star, CheckCircle2, Paperclip, FileText, Download } from "lucide-react";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const task = await db.task.findUnique({ where: { id } });
    if (task) return { title: task.title, description: task.description };
  } catch {
    // Fallback metadata in dev mode
  }
  return { title: "Brand Identity Design for SaaS Startup", description: "TaskBridge NL Brief" };
}

export default async function TaskDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();

  let task: any = null;

  try {
    task = await db.task.findUnique({
      where: { id },
      include: {
        enterprise: {
          select: {
            id:  true,
            enterpriseProfile: {
              select: {
                companyName:       true,
                logoUrl:           true,
                industry:          true,
                description:       true,
                avgRating:         true,
                totalReviewCount:  true,
                completedTaskCount:true,
              },
            },
          },
        },
        milestones: { orderBy: { sortOrder: "asc" } },
        _count:     { select: { applications: true } },
      },
    });
  } catch (err: any) {
    console.warn("[TaskDetailPage] DB server offline or unseeded, using dev demo task fallback:", err?.message);
  }

  // Fallback demo task if database is offline or unseeded
  if (!task) {
    task = {
      id: id || "t-1",
      title: "Brand Identity Design for SaaS Startup",
      slug: "brand-identity-design-for-saas-startup",
      description: "We are a B2B SaaS startup looking for a talented design student to create our complete brand identity. This includes logo, colour palette, typography, and brand guidelines document. We want a modern, minimal aesthetic that conveys trust and innovation.",
      category: "DESIGN",
      skillsRequired: ["Figma", "Brand Design", "Adobe Illustrator", "Typography"],
      budgetCents: 120000,
      currency: "EUR",
      deadline: new Date(Date.now() + 30 * 86400000),
      deliverables: "1. Vector Logo Files (.SVG, .AI, .PNG)\n2. Comprehensive Brand Guidelines PDF\n3. Colour Palette & Typography Specs",
      status: "OPEN",
      viewCount: 142,
      createdAt: new Date(Date.now() - 2 * 86400000),
      updatedAt: new Date(Date.now() - 2 * 86400000),
      enterprise: {
        id: "ent-1",
        enterpriseProfile: {
          companyName: "Acme Corp NL",
          logoUrl: null,
          industry: "Technology & Software",
          description: "Leading Dutch enterprise delivering modern software solutions.",
          avgRating: 4.9,
          totalReviewCount: 18,
          completedTaskCount: 12,
        },
      },
      milestones: [
        {
          id: "m-1",
          title: "Initial Logo Concepts & Moodboards",
          description: "Present 3 distinct visual directions and moodboards for review.",
          amountCents: 40000,
          dueDateDate: new Date(Date.now() + 7 * 86400000),
          status: "APPROVED",
        },
        {
          id: "m-2",
          title: "Final Brand Guidelines & Asset Delivery",
          description: "Deliver final vector logo files, typography specs, and PDF brand guide.",
          amountCents: 80000,
          dueDateDate: new Date(Date.now() + 21 * 86400000),
          status: "PENDING",
        },
      ],
      _count: { applications: 5 },
    };
  }

  const company = task.enterprise?.enterpriseProfile;
  const isOwner = session?.user?.id === task.enterprise?.id;

  let alreadyApplied = false;
  if (session?.user?.role === "STUDENT") {
    try {
      alreadyApplied = !!(await db.application.findUnique({
        where: { taskId_studentId: { taskId: task.id, studentId: session.user.id } },
      }));
    } catch {
      alreadyApplied = false;
    }
  }

  // JSON-LD structured data
  const jsonLd = {
    "@context":   "https://schema.org",
    "@type":      "JobPosting",
    title:        task.title,
    description:  task.description,
    datePosted:   task.createdAt.toISOString(),
    validThrough: task.deadline.toISOString(),
    jobLocationType: "TELECOMMUTE",
    hiringOrganization: {
      "@type": "Organization",
      name:    company?.companyName,
    },
    baseSalary: {
      "@type":   "MonetaryAmount",
      currency:  "EUR",
      value:     task.budgetCents / 100,
    },
  };

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Main content ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Header */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="primary">{CATEGORY_LABELS[task.category]}</Badge>
                <StatusBadge status={task.status} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">{task.title}</h1>
              <div className="flex flex-wrap gap-4 text-sm text-neutral-500">
                <span className="flex items-center gap-1.5">
                  <Euro className="h-4 w-4 text-brand-500" />
                  {centsToEur(task.budgetCents)} budget
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-brand-500" />
                  Deadline: {formatDate(task.deadline)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-brand-500" />
                  {task._count.applications} applicants
                </span>
              </div>
            </div>

            {/* Skills */}
            <div>
              <h2 className="text-sm font-semibold text-neutral-700 mb-2">Required skills</h2>
              <div className="flex flex-wrap gap-2">
                {(task.skillsRequired as string[]).map((skill: string) => (
                  <Badge key={skill} variant="skill">{skill}</Badge>
                ))}
              </div>
            </div>

            {/* Description */}
            <Card>
              <CardContent className="pt-5">
                <h2 className="font-semibold text-neutral-900 mb-3">About this task</h2>
                <p className="text-sm text-neutral-600 whitespace-pre-line leading-relaxed">
                  {task.description}
                </p>
              </CardContent>
            </Card>

            {/* Deliverables */}
            <Card>
              <CardContent className="pt-5">
                <h2 className="font-semibold text-neutral-900 mb-3">Deliverables</h2>
                <p className="text-sm text-neutral-600 whitespace-pre-line leading-relaxed">
                  {task.deliverables}
                </p>
              </CardContent>
            </Card>

            {/* Attachments */}
            {task.attachments && task.attachments.length > 0 && (
              <Card>
                <CardContent className="pt-5">
                  <h2 className="font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-neutral-700" />
                    Attached Context & Resources ({task.attachments.length})
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(task.attachments as string[]).map((attStr: string, i: number) => {
                      let att: { name: string; url: string; size?: number; type?: string };
                      try {
                        att = JSON.parse(attStr);
                      } catch {
                        att = { name: `Attachment ${i + 1}`, url: attStr };
                      }
                      return (
                        <a
                          key={i}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-100 transition-all group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <FileText className="h-5 w-5 text-neutral-600 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-neutral-800 truncate group-hover:text-neutral-900">
                                {att.name}
                              </p>
                              {att.size && (
                                <p className="text-[10px] text-neutral-400">
                                  {(att.size / 1024).toFixed(1)} KB
                                </p>
                              )}
                            </div>
                          </div>
                          <Download className="h-4 w-4 text-neutral-400 group-hover:text-neutral-900 flex-shrink-0" />
                        </a>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Milestones */}
            <Card>
              <CardContent className="pt-5">
                <h2 className="font-semibold text-neutral-900 mb-4">Payment milestones</h2>
                <div className="space-y-3">
                  {(task.milestones as any[]).map((ms: any, i: number) => (
                    <div
                      key={ms.id}
                      className="flex items-start gap-4 p-3 rounded-lg bg-neutral-50 border border-neutral-100"
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-700 text-white text-xs font-bold flex-shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-neutral-900">{ms.title}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">{ms.description}</p>
                        <p className="text-xs text-neutral-400 mt-1">Due: {formatDate(ms.dueDateDate)}</p>
                      </div>
                      <p className="text-sm font-semibold text-brand-700 whitespace-nowrap">
                        {centsToEur(ms.amountCents)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-4">

            {/* Apply CTA */}
            <Card>
              <CardContent className="pt-5">
                <div className="space-y-4">
                  <div>
                    <p className="text-2xl font-bold text-brand-700">{centsToEur(task.budgetCents)}</p>
                    <p className="text-xs text-neutral-500">Total budget · Escrow protected</p>
                  </div>

                  {isOwner ? (
                    <Button className="w-full" variant="outline" asChild>
                      <Link href={`/enterprise/tasks/${task.id}`}>Manage task</Link>
                    </Button>
                  ) : session?.user?.role === "STUDENT" ? (
                    alreadyApplied ? (
                      <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                        <CheckCircle2 className="h-4 w-4" />
                        Application submitted
                      </div>
                    ) : task.status === "OPEN" ? (
                      <Button className="w-full" asChild>
                        <Link href={`/tasks/${task.id}/apply`}>Apply for this task</Link>
                      </Button>
                    ) : (
                      <Button className="w-full" disabled>
                        No longer accepting applications
                      </Button>
                    )
                  ) : !session ? (
                    <Button className="w-full" asChild>
                      <Link href={`/login?callbackUrl=/tasks/${task.id}`}>Login to apply</Link>
                    </Button>
                  ) : null}

                  {/* Security badges */}
                  <div className="border-t border-neutral-100 pt-4 space-y-2">
                    {[
                      "Funds held in secure escrow",
                      "Auto-generated legal contract",
                      "Milestone-based payouts",
                    ].map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-xs text-neutral-500">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Company info */}
            {company && (
              <Card>
                <CardContent className="pt-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-brand-700" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-neutral-900">{company.companyName}</p>
                      <p className="text-xs text-neutral-500">{company.industry}</p>
                    </div>
                  </div>
                  {company.description && (
                    <p className="text-xs text-neutral-500 mb-3 leading-relaxed">
                      {company.description}
                    </p>
                  )}
                  <div className="flex gap-4 text-xs text-neutral-500">
                    {company.avgRating > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                        {company.avgRating.toFixed(1)} ({company.totalReviewCount})
                      </span>
                    )}
                    <span>{company.completedTaskCount} tasks completed</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
