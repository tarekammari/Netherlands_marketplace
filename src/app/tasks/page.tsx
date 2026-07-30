/**
 * src/app/tasks/page.tsx
 *
 * Public Task Roster Listing Page — Range Rover / Apple Series Ultra-Luxury Design.
 * Renders real database tasks directly from Neon database.
 */

import type { Metadata } from "next";
import { db } from "@/lib/db";
import { TaskCard } from "@/components/tasks/task-card";
import { taskSearchSchema } from "@/lib/validations/task";
import { TaskFilters } from "@/components/tasks/task-filters";
import type { Prisma } from "@prisma/client";
import { SearchX, ChevronLeft, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title:       "Browse Tasks & Briefs",
  description: "Find short-term professional tasks from Dutch enterprises. Research, design, data analysis, marketing, and development.",
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function TasksPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;

  const raw = Object.fromEntries(
    Object.entries(resolvedSearchParams || {}).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
  );

  const filters = taskSearchSchema.parse(raw);
  const { q, category, minBudget, maxBudget, skills, page, limit, sort } = filters;

  const where: Prisma.TaskWhereInput = {
    status: "OPEN",
    ...(category && { category }),
    ...(minBudget !== undefined && { budgetCents: { gte: minBudget } }),
    ...(maxBudget !== undefined && { budgetCents: { lte: maxBudget } }),
    ...(skills && {
      skillsRequired: { hasSome: skills.split(",").map((s) => s.trim()) },
    }),
    ...(q && {
      OR: [
        { title:       { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ],
    }),
  };

  const orderBy: Prisma.TaskOrderByWithRelationInput = (() => {
    switch (sort) {
      case "deadline":    return { deadline:    "asc" };
      case "budget_asc":  return { budgetCents: "asc" };
      case "budget_desc": return { budgetCents: "desc" };
      default:            return { createdAt:   "desc" };
    }
  })();

  let tasks: any[] = [];
  let total = 0;

  try {
    const res = await Promise.all([
      db.task.findMany({
        where,
        include: {
          enterprise: {
            select: {
              enterpriseProfile: { select: { companyName: true, logoUrl: true } },
            },
          },
          _count: { select: { applications: true } },
        },
        orderBy,
        take:  limit,
        skip:  (page - 1) * limit,
      }),
      db.task.count({ where }),
    ]);
    tasks = res[0];
    total = res[1];
  } catch (err) {
    console.error("[TasksPage] DB fetch error:", err);
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-[#fafafb] text-neutral-900 py-12 md:py-16">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        
        {/* Centered Luxury Header */}
        <div className="mb-14 text-center">
          <div className="text-[11px] font-mono tracking-[0.3em] uppercase font-bold text-orange-600 mb-2.5">
            ACADEMIC TASK ROSTER
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-[#111827] uppercase">
            FEATURED TASK BRIEFS
          </h1>
          <p className="text-neutral-600 mt-3 max-w-xl mx-auto text-xs sm:text-sm leading-relaxed font-normal">
            Commissioned by top Dutch enterprises with locked Stripe escrow funding and digital legal contracts.
          </p>

          <div className="mt-4 inline-flex items-center gap-2 font-mono text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200/60">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            {total} ACTIVE BRIEF{total === 1 ? "" : "S"} AVAILABLE
          </div>
        </div>

        {/* Main Roster Layout: Filter Sidebar + Task Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          {/* Filter Sidebar */}
          <aside className="lg:col-span-1">
            <TaskFilters currentFilters={filters} />
          </aside>

          {/* Task Grid */}
          <main className="lg:col-span-3 min-w-0">
            {tasks.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  {tasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="mt-14 flex items-center justify-center gap-3 font-mono text-xs">
                    {page > 1 && (
                      <a
                        href={`?page=${page - 1}&${new URLSearchParams({ ...raw, page: (page - 1).toString() })}`}
                        className="flex items-center gap-1 px-4 py-2 rounded-lg bg-white border border-neutral-300 font-bold text-neutral-800 hover:border-orange-500 hover:text-orange-600 transition-all shadow-sm"
                      >
                        <ChevronLeft size={14} /> Previous
                      </a>
                    )}

                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <a
                          key={p}
                          href={`?page=${p}&${new URLSearchParams({ ...raw, page: p.toString() })}`}
                          aria-current={p === page ? "page" : undefined}
                          className={`h-9 w-9 flex items-center justify-center rounded-lg font-bold transition-all ${
                            p === page
                              ? "bg-orange-600 text-white shadow-md shadow-orange-500/20"
                              : "bg-white border border-neutral-200 text-neutral-700 hover:border-orange-400 hover:text-orange-600"
                          }`}
                        >
                          {p}
                        </a>
                      ))}
                    </div>

                    {page < totalPages && (
                      <a
                        href={`?page=${page + 1}&${new URLSearchParams({ ...raw, page: (page + 1).toString() })}`}
                        className="flex items-center gap-1 px-4 py-2 rounded-lg bg-white border border-neutral-300 font-bold text-neutral-800 hover:border-orange-500 hover:text-orange-600 transition-all shadow-sm"
                      >
                        Next <ChevronRight size={14} />
                      </a>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-2xl border border-neutral-200/90 p-12 text-center flex flex-col items-center justify-center shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mb-4">
                  <SearchX size={28} />
                </div>
                <h3 className="text-lg font-black text-neutral-900 uppercase tracking-wide mb-1">
                  No Task Briefs Found
                </h3>
                <p className="text-xs text-neutral-500 max-w-sm font-normal mb-6">
                  No open briefs matched your current category, search term, or budget filter settings.
                </p>
                <a
                  href="/tasks"
                  className="inline-flex items-center justify-center rounded-sm bg-neutral-900 px-6 py-2.5 text-xs font-mono font-bold uppercase tracking-wider text-white hover:bg-orange-600 transition-all shadow-sm"
                >
                  Reset All Filters
                </a>
              </div>
            )}
          </main>

        </div>

      </div>
    </div>
  );
}
