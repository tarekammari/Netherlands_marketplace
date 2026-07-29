/**
 * src/app/api/tasks/route.ts
 *
 * GET  /api/tasks — Public task listing with full-text search and filtering.
 * POST /api/tasks — Create a new task (Enterprise only).
 */

import { type NextRequest } from "next/server";
import { ZodError } from "zod";
import slugify from "slugify";
import { nanoid } from "nanoid";

import { db } from "@/lib/db";
import { withEnterprise } from "@/lib/guards";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { ok, created, serverError, validationError } from "@/lib/api-response";
import { createTaskSchema, taskSearchSchema } from "@/lib/validations/task";
import type { Prisma } from "@prisma/client";

// ── GET: Public task listing ───────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const rl = await rateLimit("public", request);
  if (!rl.success) return rateLimitResponse(rl);

  try {
    // Parse and validate query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const filters = taskSearchSchema.parse(searchParams);

    const { q, category, minBudget, maxBudget, skills, status, page, limit, sort } = filters;

    // Build Prisma where clause dynamically
    const where: Prisma.TaskWhereInput = {
      status,
      ...(category && { category }),
      ...(minBudget !== undefined && { budgetCents: { gte: minBudget } }),
      ...(maxBudget !== undefined && { budgetCents: { lte: maxBudget } }),
      ...(skills && {
        skillsRequired: {
          hasSome: skills.split(",").map((s) => s.trim()),
        },
      }),
    };

    // Full-text search via raw query when `q` is provided
    // We use Prisma's queryRaw for the tsvector search
    let tasks;
    const offset = (page - 1) * limit;

    if (q) {
      // Sanitise the search query (remove special tsquery characters)
      const sanitised = q.replace(/[^a-zA-Z0-9\s]/g, "").trim();
      tasks = await db.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM tasks
        WHERE status = ${status}
          AND "searchVector" @@ plainto_tsquery('dutch', ${sanitised})
        ORDER BY ts_rank("searchVector", plainto_tsquery('dutch', ${sanitised})) DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      const ids = tasks.map((t) => t.id);
      tasks = await db.task.findMany({
        where: { id: { in: ids }, ...where },
        include: { enterprise: { select: { enterpriseProfile: { select: { companyName: true, logoUrl: true } } } } },
        take: limit,
      });
    } else {
      // Build orderBy
      const orderBy: Prisma.TaskOrderByWithRelationInput = (() => {
        switch (sort) {
          case "deadline":    return { deadline: "asc" };
          case "budget_asc":  return { budgetCents: "asc" };
          case "budget_desc": return { budgetCents: "desc" };
          default:            return { createdAt: "desc" };
        }
      })();

      [tasks] = await Promise.all([
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
          take: limit,
          skip: offset,
        }),
      ]);
    }

    const total = await db.task.count({ where });

    return ok({
      tasks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error instanceof ZodError) return validationError(error);
    return serverError(error, "GET /api/tasks");
  }
}

// ── POST: Create task (Enterprise only) ───────────────────────────────────────

export const POST = withEnterprise(async (request, { session }) => {
  const rl = await rateLimit("api", request);
  if (!rl.success) return rateLimitResponse(rl);

  try {
    const body = await request.json() as unknown;
    const data = createTaskSchema.parse(body);

    // Generate a unique, SEO-friendly slug
    const baseSlug = slugify(data.title, { lower: true, strict: true });
    const slug = `${baseSlug}-${nanoid(8)}`;

    // Validate milestone amounts sum to budget
    const milestoneTotal = data.milestones.reduce((sum, m) => sum + m.amountCents, 0);
    if (milestoneTotal !== data.budgetCents) {
      const { badRequest } = await import("@/lib/api-response");
      return badRequest(
        `Milestone amounts (€${(milestoneTotal / 100).toFixed(2)}) must equal the total budget (€${(data.budgetCents / 100).toFixed(2)}).`
      );
    }

    const task = await db.$transaction(async (tx) => {
      const newTask = await tx.task.create({
        data: {
          enterpriseId:    session.user.id,
          title:           data.title,
          slug,
          description:     data.description,
          category:        data.category,
          skillsRequired:  data.skillsRequired,
          attachments:     data.attachments ?? [],
          budgetCents:     data.budgetCents,
          deadline:        new Date(data.deadline),
          deliverables:    data.deliverables,
          status:          "DRAFT",
        },
      });

      await tx.milestone.createMany({
        data: data.milestones.map((m) => ({
          taskId:      newTask.id,
          title:       m.title,
          description: m.description,
          dueDateDate: new Date(m.dueDate),
          amountCents: m.amountCents,
          sortOrder:   m.sortOrder,
        })),
      });

      // Update enterprise post count
      await tx.enterpriseProfile.update({
        where:  { userId: session.user.id },
        data:   { postedTaskCount: { increment: 1 } },
      });

      return newTask;
    });

    return created({ task });
  } catch (error) {
    if (error instanceof ZodError) return validationError(error);
    return serverError(error, "POST /api/tasks");
  }
});
