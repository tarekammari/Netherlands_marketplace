"use client";

/**
 * src/components/tasks/task-card.tsx
 *
 * Ultra-Luxury Task Card matching Homepage Section 1, 2, and 5 Design Philosophy.
 * High contrast, Range Rover / Apple Series inspired styling with hover lift transitions.
 */

import Link from "next/link";
import { Calendar, Users, ChevronRight } from "lucide-react";
import { centsToEur, formatDate, truncate, CATEGORY_LABELS } from "@/lib/utils";
import type { TaskStatus, TaskCategory } from "@prisma/client";

interface TaskCardProps {
  task: {
    id:             string;
    title:          string;
    description:    string;
    category:       TaskCategory;
    skillsRequired: string[];
    budgetCents:    number;
    deadline:       Date | string;
    status:         TaskStatus;
    _count?:        { applications: number };
    enterprise?: {
      enterpriseProfile?: {
        companyName: string;
        logoUrl?:    string | null;
      } | null;
    };
  };
}

export function TaskCard({ task }: TaskCardProps) {
  const companyName = task.enterprise?.enterpriseProfile?.companyName ?? "Dutch Enterprise";
  const categoryLabel = CATEGORY_LABELS[task.category] ?? task.category;

  return (
    <Link
      href={`/tasks/${task.id}`}
      className="bg-white rounded-2xl p-7 md:p-8 border border-neutral-200/90 shadow-sm relative overflow-hidden group hover:border-orange-400 hover:shadow-xl hover:-translate-y-1.5 active:scale-[0.99] transition-all duration-300 flex flex-col justify-between cursor-pointer"
    >
      {/* Corner Glow Overlay */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-bl-full pointer-events-none" />

      <div>
        {/* Top Header Row: Company + Status Badge */}
        <div className="flex items-center justify-between mb-5 border-b border-neutral-100 pb-3 gap-2">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)] flex-shrink-0" />
            <span className="text-[10px] uppercase tracking-widest font-mono font-bold text-neutral-900 group-hover:text-orange-600 transition-colors truncate">
              {companyName}
            </span>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="font-mono text-[9px] uppercase font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
              {categoryLabel}
            </span>
            <span className="font-mono text-[9px] uppercase font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200/60 group-hover:bg-orange-600 group-hover:text-white transition-all">
              OPEN BRIEF
            </span>
          </div>
        </div>

        {/* Task Title */}
        <h3 className="text-base sm:text-lg font-black text-neutral-900 leading-snug group-hover:text-orange-600 transition-colors mb-3 uppercase tracking-wide">
          {task.title}
        </h3>

        {/* Description Preview */}
        {task.description && (
          <p className="text-xs sm:text-sm text-neutral-600 line-clamp-3 leading-relaxed mb-6 font-normal">
            {truncate(task.description, 140)}
          </p>
        )}

        {/* Skills Required */}
        {task.skillsRequired.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-6">
            {task.skillsRequired.slice(0, 4).map((skill) => (
              <span
                key={skill}
                className="text-[10px] font-mono font-bold text-neutral-600 bg-neutral-100 px-2.5 py-1 rounded-md border border-neutral-200/60 group-hover:bg-orange-50 group-hover:text-orange-700 transition-colors"
              >
                {skill}
              </span>
            ))}
            {task.skillsRequired.length > 4 && (
              <span className="text-[10px] font-mono font-bold text-neutral-400 bg-neutral-50 px-2 py-1 rounded">
                +{task.skillsRequired.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="flex items-center justify-between border-t border-neutral-100 pt-4 mt-auto">
        <div className="flex items-center gap-4">
          <span className="text-base font-mono font-black text-orange-600">
            {centsToEur(task.budgetCents)}
          </span>
          <span className="text-[11px] text-neutral-500 font-mono flex items-center gap-1">
            <Calendar size={12} /> {formatDate(task.deadline)}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {task._count && (
            <span className="text-[11px] text-neutral-500 flex items-center gap-1 font-mono">
              <Users size={12} /> {task._count.applications}
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-neutral-900 group-hover:text-orange-600 transition-colors">
            APPLY <ChevronRight size={13} />
          </span>
        </div>
      </div>
    </Link>
  );
}
