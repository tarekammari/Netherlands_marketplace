/**
 * src/app/api/applications/route.ts
 *
 * POST /api/applications — Student applies to a task.
 * GET  /api/applications — List applications (filtered by task or student).
 */

import { ZodError } from "zod";

import { db } from "@/lib/db";
import { withStudent, withAuth } from "@/lib/guards";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { ok, created, badRequest, conflict, notFound, serverError, validationError } from "@/lib/api-response";
import { createApplicationSchema } from "@/lib/validations/task";
import { sendApplicationNotification } from "@/lib/email";
import { logger } from "@/lib/logger";

// ── POST: Apply to task (Student only) ────────────────────────────────────────

export const POST = withStudent(async (request, { session }) => {
  const rl = await rateLimit("api", request);
  if (!rl.success) return rateLimitResponse(rl);

  try {
    const body = await request.json() as unknown;
    const data = createApplicationSchema.parse(body);

    // Verify the task exists and is open
    const task = await db.task.findUnique({
      where: { id: data.taskId },
      include: {
        enterprise: { select: { email: true, nameEncrypted: true } },
      },
    });

    if (!task) return notFound("Task");
    if (task.status !== "OPEN") {
      return badRequest("This task is not accepting applications.");
    }

    // Students cannot apply to tasks they posted (safety check)
    if (task.enterpriseId === session.user.id) {
      return badRequest("You cannot apply to your own task.");
    }

    // Check for duplicate application
    const existing = await db.application.findUnique({
      where: { taskId_studentId: { taskId: data.taskId, studentId: session.user.id } },
    });
    if (existing) return conflict("You have already applied to this task.");

    const application = await db.application.create({
      data: {
        taskId:              data.taskId,
        studentId:           session.user.id,
        coverLetter:         data.coverLetter,
        proposedBudgetCents: data.proposedBudgetCents ?? null,
        estimatedDays:       data.estimatedDays ?? null,
        portfolioLinks:      data.portfolioLinks,
      },
    });

    // Notify enterprise via email (non-blocking)
    const studentProfile = await db.studentProfile.findUnique({
      where: { userId: session.user.id },
    });

    const appUrl = `${process.env["NEXT_PUBLIC_APP_URL"]}/enterprise/tasks/${task.id}/applications/${application.id}`;

    sendApplicationNotification(
      task.enterprise.email,
      studentProfile?.university ?? "A student",
      task.title,
      appUrl
    ).catch((err) => logger.error("[Application] Email notification failed", { err }));

    return created({ application });
  } catch (error) {
    if (error instanceof ZodError) return validationError(error);
    return serverError(error, "POST /api/applications");
  }
});

// ── GET: List applications ────────────────────────────────────────────────────

export const GET = withAuth(async (request, { session }) => {
  const taskId    = request.nextUrl.searchParams.get("taskId");
  const studentId = request.nextUrl.searchParams.get("studentId");

  try {
    // Students see their own applications
    if (session.user.role === "STUDENT") {
      const apps = await db.application.findMany({
        where:   { studentId: session.user.id },
        include: { task: { select: { id: true, title: true, status: true, budgetCents: true, deadline: true } } },
        orderBy: { createdAt: "desc" },
      });
      return ok(apps);
    }

    // Enterprises see applications for their tasks
    if (session.user.role === "ENTERPRISE") {
      if (!taskId) return badRequest("taskId is required for enterprise queries.");

      // Verify enterprise owns the task
      const task = await db.task.findFirst({
        where: { id: taskId, enterpriseId: session.user.id },
      });
      if (!task) return notFound("Task");

      const apps = await db.application.findMany({
        where:   { taskId },
        include: {
          student: {
            select: {
              id: true,
              avatarUrl: true,
              studentProfile: {
                select: { university: true, skills: true, avgRating: true, completedTaskCount: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return ok(apps);
    }

    // Admins can query by studentId or taskId
    if (session.user.role === "ADMIN") {
      const where = taskId ? { taskId } : studentId ? { studentId } : {};
      const apps = await db.application.findMany({
        where,
        include: { task: true, student: true },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      return ok(apps);
    }

    return badRequest("Invalid query");
  } catch (error) {
    return serverError(error, "GET /api/applications");
  }
});
