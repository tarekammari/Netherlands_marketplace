"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { centsToEur, formatDate, CATEGORY_LABELS } from "@/lib/utils";
import { TaskStatus, TaskCategory } from "@prisma/client";
import {
  Search,
  PlusCircle,
  Users,
  Calendar,
  Euro,
  ChevronRight,
  ExternalLink,
  Briefcase,
  Layers,
} from "lucide-react";

export interface EnterpriseTaskItem {
  id: string;
  title: string;
  slug: string;
  category: TaskCategory;
  status: TaskStatus;
  budgetCents: number;
  deadline: string;
  createdAt: string;
  skillsRequired: string[];
  applicationsCount: number;
  pendingApplicationsCount: number;
  milestoneCount: number;
  completedMilestonesCount: number;
  hasContract: boolean;
  contractStatus?: string | undefined;
  paymentStatus?: string | undefined;
}

interface EnterpriseTaskListProps {
  tasks: EnterpriseTaskItem[];
}

export function EnterpriseTaskList({ tasks }: EnterpriseTaskListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Status counts for tabs
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: tasks.length,
      OPEN: 0,
      ACTIVE: 0, // IN_PROGRESS / ASSIGNED / IN_REVIEW
      COMPLETED: 0,
      DRAFT: 0,
    };

    tasks.forEach((t) => {
      if (t.status === "OPEN") counts["OPEN"] = (counts["OPEN"] || 0) + 1;
      else if (["IN_PROGRESS", "ASSIGNED", "IN_REVIEW"].includes(t.status)) counts["ACTIVE"] = (counts["ACTIVE"] || 0) + 1;
      else if (t.status === "COMPLETED") counts["COMPLETED"] = (counts["COMPLETED"] || 0) + 1;
      else if (t.status === "DRAFT") counts["DRAFT"] = (counts["DRAFT"] || 0) + 1;
    });

    return counts;
  }, [tasks]);

  // Filter tasks based on search query and status tab
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Status filter
      if (selectedStatus === "OPEN" && t.status !== "OPEN") return false;
      if (selectedStatus === "ACTIVE" && !["IN_PROGRESS", "ASSIGNED", "IN_REVIEW"].includes(t.status)) return false;
      if (selectedStatus === "COMPLETED" && t.status !== "COMPLETED") return false;
      if (selectedStatus === "DRAFT" && t.status !== "DRAFT") return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesCategory = CATEGORY_LABELS[t.category]?.toLowerCase().includes(q);
        const matchesSkills = t.skillsRequired.some((s) => s.toLowerCase().includes(q));
        return matchesTitle || matchesCategory || matchesSkills;
      }

      return true;
    });
  }, [tasks, selectedStatus, searchQuery]);

  return (
    <div className="space-y-6">
      {/* ── Search & Filter Controls ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: "ALL", label: "All Tasks" },
            { id: "OPEN", label: "Open" },
            { id: "ACTIVE", label: "In Progress" },
            { id: "COMPLETED", label: "Completed" },
            { id: "DRAFT", label: "Drafts" },
          ].map((tab) => {
            const count = statusCounts[tab.id] || 0;
            const isActive = selectedStatus === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedStatus(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-neutral-900 text-white shadow-sm"
                    : "bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200/80"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    isActive ? "bg-neutral-800 text-white" : "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title or skill..."
            className="pl-9 text-xs rounded-xl h-10 bg-white"
          />
        </div>
      </div>

      {/* ── Tasks List ── */}
      {filteredTasks.length === 0 ? (
        <Card className="border-neutral-200/80 rounded-2xl shadow-xs py-12 text-center bg-white">
          <CardContent className="space-y-4">
            <div className="h-12 w-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
              <Briefcase className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900">No tasks found</h3>
              <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                {searchQuery || selectedStatus !== "ALL"
                  ? "Try clearing your search filters or status selection."
                  : "You haven't posted any tasks yet. Create your first task to start hiring top university talent."}
              </p>
            </div>
            {tasks.length === 0 && (
              <Button asChild size="sm" className="mt-2">
                <Link href="/enterprise/tasks/new" className="flex items-center gap-2">
                  <PlusCircle className="h-4 w-4" /> Post Your First Task
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredTasks.map((task) => (
            <Card
              key={task.id}
              className="border-neutral-200 shadow-xs hover:shadow-md transition-all duration-200 rounded-2xl overflow-hidden bg-white group"
            >
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Left Column: Details */}
                  <div className="space-y-3 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="primary">{CATEGORY_LABELS[task.category]}</Badge>
                      <StatusBadge status={task.status} />
                      {task.pendingApplicationsCount > 0 && (
                        <span className="text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Users className="h-3 w-3 text-amber-600" />
                          {task.pendingApplicationsCount} new application{task.pendingApplicationsCount > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>

                    <div>
                      <Link
                        href={`/enterprise/tasks/${task.id}`}
                        className="text-base font-bold text-neutral-900 hover:text-brand-700 transition-colors line-clamp-1"
                      >
                        {task.title}
                      </Link>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-neutral-500">
                      <span className="flex items-center gap-1.5 font-bold text-neutral-900">
                        <Euro className="h-4 w-4 text-emerald-600" />
                        {centsToEur(task.budgetCents)}
                      </span>

                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                        Deadline: {formatDate(new Date(task.deadline))}
                      </span>

                      <span className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-neutral-400" />
                        {task.applicationsCount} applicant{task.applicationsCount !== 1 ? "s" : ""}
                      </span>

                      {task.milestoneCount > 0 && (
                        <span className="flex items-center gap-1.5">
                          <Layers className="h-3.5 w-3.5 text-neutral-400" />
                          Milestones: {task.completedMilestonesCount}/{task.milestoneCount} approved
                        </span>
                      )}
                    </div>

                    {/* Skills required list */}
                    {task.skillsRequired.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {task.skillsRequired.slice(0, 5).map((skill) => (
                          <Badge key={skill} variant="skill" className="text-[10px] py-0.5">
                            {skill}
                          </Badge>
                        ))}
                        {task.skillsRequired.length > 5 && (
                          <span className="text-[10px] text-neutral-400 self-center">
                            +{task.skillsRequired.length - 5} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Quick Action Buttons */}
                  <div className="flex items-center gap-2 lg:flex-col lg:items-end justify-end border-t lg:border-t-0 pt-4 lg:pt-0 border-neutral-100 flex-shrink-0">
                    <Button asChild size="sm" className="w-full lg:w-auto font-medium">
                      <Link href={`/enterprise/tasks/${task.id}`} className="flex items-center gap-1.5">
                        Manage Task <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>

                    <Button variant="ghost" size="sm" asChild className="text-xs text-neutral-500 hover:text-neutral-900">
                      <Link href={`/tasks/${task.id}`} target="_blank" className="flex items-center gap-1">
                        View Listing <ExternalLink className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
