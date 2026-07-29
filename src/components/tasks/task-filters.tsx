"use client";

/**
 * src/components/tasks/task-filters.tsx
 *
 * Luxury Client-Side Filter Sidebar & Search Controller matching Range Rover / Apple design philosophy.
 * Enables real-time URL search param updates, category selection, and sorting.
 */

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition, useState } from "react";
import { CATEGORY_LABELS } from "@/lib/utils";
import { Search, SlidersHorizontal, RotateCcw, ArrowUpDown } from "lucide-react";
import type { TaskCategory } from "@prisma/client";

interface TaskFiltersProps {
  currentFilters: {
    q?:         string | undefined;
    category?:  TaskCategory | undefined;
    minBudget?: number | undefined;
    maxBudget?: number | undefined;
    sort:       string;
  };
}

const SORT_OPTIONS = [
  { value: "newest",      label: "Newest First" },
  { value: "deadline",    label: "Deadline Soonest" },
  { value: "budget_desc", label: "Highest Budget" },
  { value: "budget_asc",  label: "Lowest Budget" },
];

export function TaskFilters({ currentFilters }: TaskFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState(currentFilters.q ?? "");

  const updateFilter = useCallback(
    (key: string, value: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.set("page", "1");
      startTransition(() => {
        router.push(`?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilter("q", searchQuery.trim() || undefined);
  };

  const clearAll = useCallback(() => {
    setSearchQuery("");
    startTransition(() => router.push("/tasks"));
  }, [router]);

  return (
    <div className="bg-white rounded-2xl border border-neutral-200/90 p-6 shadow-sm space-y-7 sticky top-24">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="text-orange-600" size={16} />
          <h3 className="text-xs font-mono font-bold text-neutral-900 uppercase tracking-widest">
            Filter Roster
          </h3>
        </div>
        {(currentFilters.category || currentFilters.minBudget || currentFilters.q || currentFilters.sort !== "newest") && (
          <button
            onClick={clearAll}
            disabled={isPending}
            className="text-[10px] font-mono font-bold text-orange-600 hover:text-orange-700 uppercase flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RotateCcw size={11} /> Clear
          </button>
        )}
      </div>

      {/* Full-text Search Bar */}
      <form onSubmit={handleSearchSubmit}>
        <label className="block text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest mb-2">
          Search Briefs
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search keywords, skills..."
            className="w-full rounded-xl border border-neutral-200 pl-9 pr-4 py-2.5 text-xs font-medium focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={14} />
        </div>
      </form>

      {/* Sort Options */}
      <div>
        <label className="block text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest mb-2 flex items-center gap-1">
          <ArrowUpDown size={12} className="text-orange-600" />
          Sort Order
        </label>
        <div className="space-y-1">
          {SORT_OPTIONS.map(({ value, label }) => {
            const active = currentFilters.sort === value;
            return (
              <button
                key={value}
                onClick={() => updateFilter("sort", value)}
                className={`w-full text-left text-xs font-mono font-bold px-3 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-between ${
                  active
                    ? "bg-orange-600 text-white shadow-sm"
                    : "text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                <span>{label}</span>
                {active && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Categories Filter */}
      <div>
        <label className="block text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest mb-2">
          Task Category
        </label>
        <div className="space-y-1">
          <button
            onClick={() => updateFilter("category", undefined)}
            className={`w-full text-left text-xs font-mono font-bold px-3 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-between ${
              !currentFilters.category
                ? "bg-neutral-900 text-white shadow-sm"
                : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            <span>All Categories</span>
            {!currentFilters.category && <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
          </button>
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => {
            const active = currentFilters.category === value;
            return (
              <button
                key={value}
                onClick={() => updateFilter("category", value)}
                className={`w-full text-left text-xs font-mono font-bold px-3 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-between ${
                  active
                    ? "bg-orange-600 text-white shadow-sm"
                    : "text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                <span>{label}</span>
                {active && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Budget Range (€) */}
      <div>
        <label className="block text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest mb-2">
          Budget Range (&euro;)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Min &euro;"
            defaultValue={currentFilters.minBudget ? currentFilters.minBudget / 100 : ""}
            onBlur={(e) => {
              const val = e.target.value ? String(Number(e.target.value) * 100) : undefined;
              updateFilter("minBudget", val);
            }}
            className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-xs font-mono font-bold focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            min={0}
          />
          <input
            type="number"
            placeholder="Max &euro;"
            defaultValue={currentFilters.maxBudget ? currentFilters.maxBudget / 100 : ""}
            onBlur={(e) => {
              const val = e.target.value ? String(Number(e.target.value) * 100) : undefined;
              updateFilter("maxBudget", val);
            }}
            className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-xs font-mono font-bold focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            min={0}
          />
        </div>
      </div>

    </div>
  );
}
