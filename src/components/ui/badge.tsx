/**
 * src/components/ui/badge.tsx
 *
 * Badge component — SkillBid-inspired minimal design.
 * Variants: default | stamp | sage | primary | success | warning | danger | info | outline | skill
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors border",
  {
    variants: {
      variant: {
        // SkillBid-style badges
        stamp:   "bg-[#f0ede6] text-[#4a4a4a] border-[#e0ddd6]",
        sage:    "bg-[#d8f3dc] text-[#2d6a4f] border-[#b7e4c7]",
        // Standard variants
        default: "bg-[#f5f4f0] text-[#4a4a4a] border-[#e8e6e0]",
        primary: "bg-brand-50 text-brand-700 border-brand-200",
        success: "bg-green-50 text-green-700 border-green-200",
        warning: "bg-amber-50 text-amber-700 border-amber-200",
        danger:  "bg-red-50 text-red-700 border-red-200",
        info:    "bg-sky-50 text-sky-700 border-sky-200",
        outline: "border-[#e8e6e0] text-[#6a6a6a] bg-transparent",
        skill:   "bg-violet-50 text-violet-700 border-violet-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** Show a live status dot inside the badge */
  dot?: boolean;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, dot, children, ...props }, ref) => (
    <span ref={ref} className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className="w-[6px] h-[6px] rounded-full bg-current flex-shrink-0 animate-pulse-dot"
          aria-hidden
        />
      )}
      {children}
    </span>
  )
);

Badge.displayName = "Badge";

export { Badge, badgeVariants };

// ── Task status badge (maps status → variant) ─────────────────────────────────

import type { TaskStatus } from "@prisma/client";
import { STATUS_LABELS } from "@/lib/utils";

const STATUS_VARIANT: Record<TaskStatus, VariantProps<typeof badgeVariants>["variant"]> = {
  DRAFT:       "outline",
  OPEN:        "sage",
  IN_REVIEW:   "info",
  ASSIGNED:    "warning",
  IN_PROGRESS: "warning",
  COMPLETED:   "success",
  DISPUTED:    "danger",
  CANCELLED:   "default",
};

interface StatusBadgeProps { status: TaskStatus; className?: string }

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge
      variant={STATUS_VARIANT[status]}
      dot={status === "OPEN"}
      className={className}
    >
      {STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
