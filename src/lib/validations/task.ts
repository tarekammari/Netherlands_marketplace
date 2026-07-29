/**
 * src/lib/validations/task.ts
 * Zod schemas for task-related inputs.
 */

import { z } from "zod";
import { TaskCategory, TaskStatus } from "@prisma/client";

// ── Create / Update Task ──────────────────────────────────────────────────────

export const createTaskSchema = z.object({
  title: z
    .string({ required_error: "Title is required" })
    .min(10, "Title must be at least 10 characters")
    .max(200)
    .trim(),

  description: z
    .string({ required_error: "Description is required" })
    .min(50, "Please provide at least 50 characters of description")
    .max(10_000)
    .trim(),

  category: z.nativeEnum(TaskCategory),

  skillsRequired: z
    .array(z.string().min(1).max(50))
    .min(1, "At least one skill is required")
    .max(10, "Maximum 10 skills"),

  attachments: z
    .array(z.string())
    .optional()
    .default([]),

  // Budget in euro cents (minimum €10)
  budgetCents: z.coerce
    .number()
    .int()
    .min(1000, "Minimum budget is €10.00")
    .max(50_000_00, "Maximum budget is €50,000.00"),

  deadline: z
    .string()
    .datetime()
    .refine(
      (d) => new Date(d) > new Date(),
      "Deadline must be in the future"
    ),

  deliverables: z
    .string({ required_error: "Deliverables are required" })
    .min(20, "Please describe what deliverables you expect")
    .max(5000)
    .trim(),

  // Milestones are validated separately
  milestones: z
    .array(
      z.object({
        title:       z.string().min(3).max(200).trim(),
        description: z.string().min(10).max(1000).trim(),
        dueDate:     z.string().datetime(),
        amountCents: z.coerce.number().int().min(100),
        sortOrder:   z.number().int().min(0),
      })
    )
    .min(1, "At least one milestone is required")
    .max(10, "Maximum 10 milestones"),
});

// ── Task Search / Filters ─────────────────────────────────────────────────────

export const taskSearchSchema = z.object({
  q:        z.string().max(200).trim().optional(),
  category: z.nativeEnum(TaskCategory).optional(),
  minBudget: z.coerce.number().int().min(0).optional(),
  maxBudget: z.coerce.number().int().max(50_000_00).optional(),
  skills:   z.string().optional(), // comma-separated
  status:   z.nativeEnum(TaskStatus).default(TaskStatus.OPEN),
  page:     z.coerce.number().int().min(1).default(1),
  limit:    z.coerce.number().int().min(1).max(50).default(12),
  sort:     z.enum(["newest", "deadline", "budget_asc", "budget_desc"]).default("newest"),
});

// ── Application ───────────────────────────────────────────────────────────────

export const createApplicationSchema = z.object({
  taskId:             z.string().uuid(),
  coverLetter:        z.string().min(100, "Cover letter must be at least 100 characters").max(5000).trim(),
  proposedBudgetCents: z.coerce.number().int().min(100).optional(),
  estimatedDays:      z.coerce.number().int().min(1).max(365).optional(),
  portfolioLinks:     z.array(z.string().url()).max(5).default([]),
});

// ── Milestone Submission ──────────────────────────────────────────────────────

export const submitMilestoneSchema = z.object({
  milestoneId:    z.string().uuid(),
  submissionNote: z.string().min(10).max(2000).trim(),
});

// ── Types ─────────────────────────────────────────────────────────────────────

export type CreateTaskInput        = z.infer<typeof createTaskSchema>;
export type TaskSearchInput        = z.infer<typeof taskSearchSchema>;
export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type SubmitMilestoneInput   = z.infer<typeof submitMilestoneSchema>;
