/**
 * src/lib/utils.ts
 * Shared utility functions used across the application.
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";

// ── Tailwind class merger ─────────────────────────────────────────────────────

/**
 * Merges Tailwind classes safely, resolving conflicts.
 * Usage: cn("px-4 py-2", isActive && "bg-blue-500", className)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ── Money formatting ──────────────────────────────────────────────────────────

/**
 * Formats euro cents as a currency string.
 * centsToEur(4999) → "€49.99"
 */
export function centsToEur(cents: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style:    "currency",
    currency: "EUR",
  }).format(cents / 100);
}

/**
 * Converts a euro amount string to cents integer.
 * eurToCents("49.99") → 4999
 */
export function eurToCents(eur: number): number {
  return Math.round(eur * 100);
}

// ── Date formatting ───────────────────────────────────────────────────────────

export function formatDate(date: Date | string): string {
  return format(new Date(date), "dd MMM yyyy");
}

export function formatDateTime(date: Date | string): string {
  return format(new Date(date), "dd MMM yyyy, HH:mm");
}

export function timeAgo(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

// ── String utilities ──────────────────────────────────────────────────────────

/**
 * Truncates a string to a max length with ellipsis.
 */
export function truncate(str: string, maxLength: number): string {
  return str.length > maxLength ? `${str.slice(0, maxLength)}…` : str;
}

/**
 * Returns initials from a full name (up to 2 characters).
 * "Jan de Vries" → "JD"
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

// ── Category labels ────────────────────────────────────────────────────────────

export const CATEGORY_LABELS: Record<string, string> = {
  RESEARCH:      "Research",
  DESIGN:        "Design",
  DATA_ANALYSIS: "Data Analysis",
  MARKETING:     "Marketing",
  DEVELOPMENT:   "Development",
  WRITING:       "Writing",
  FINANCE:       "Finance",
  LEGAL:         "Legal",
  OTHER:         "Other",
};

export const STATUS_LABELS: Record<string, string> = {
  DRAFT:       "Draft",
  OPEN:        "Open",
  IN_REVIEW:   "In Review",
  ASSIGNED:    "Assigned",
  IN_PROGRESS: "In Progress",
  COMPLETED:   "Completed",
  DISPUTED:    "Disputed",
  CANCELLED:   "Cancelled",
};

// ── Error handling ────────────────────────────────────────────────────────────

/**
 * Extracts a human-readable error message from an unknown error value.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "An unexpected error occurred.";
}
