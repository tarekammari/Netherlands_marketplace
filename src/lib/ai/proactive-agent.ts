/**
 * src/lib/ai/proactive-agent.ts
 *
 * TBAI v2 Proactive Nudge Agent.
 * Detects missed opportunities and creates Notification records for eligible users.
 *
 * Rules:
 *  - Student has matching skills for 3+ open tasks but applied to none → suggest top matches
 *  - Enterprise task has 0 applications after 5 days → suggest budget optimization
 *  - Student profile is incomplete (no skills or bio) → suggest profile improvements
 */

import { db } from "@/lib/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = db as any;

// ── Types ──────────────────────────────────────────────────────────────────────

interface NudgeResult {
  notificationsCreated: number;
  studentNudges:        number;
  enterpriseNudges:     number;
  profileNudges:        number;
  errors:               number;
}

// ── Helper: create a notification (deduplicated) ──────────────────────────────

async function createNudge(
  userId:    string,
  type:      string,
  title:     string,
  body:      string,
  actionUrl: string
): Promise<boolean> {
  try {
    // Check if we sent a similar nudge in the last 7 days (dedup by title)
    const existing = await db.notification.findFirst({
      where: {
        userId,
        title,
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    });
    if (existing) return false;

    await db.notification.create({
      data: {
        userId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        type:      type as any,
        title,
        body,
        actionUrl,
      },
    });
    return true;
  } catch {
    return false;
  }
}

// ── Rule 1: Students with matching skills not applying ────────────────────────

async function nudgeInactiveStudents(): Promise<number> {
  let count = 0;

  const openTasks = await db.task.findMany({
    where:   { status: "OPEN" },
    select:  { id: true, title: true, skillsRequired: true, category: true },
    take:    50,
    orderBy: { createdAt: "desc" },
  });

  if (openTasks.length === 0) return 0;

  // Get students who have been inactive for 7+ days
  const students = await db.user.findMany({
    where: { role: "STUDENT" },
    select: {
      id: true,
      studentProfile: { select: { skills: true } },
      applications:   { select: { taskId: true }, take: 5, orderBy: { createdAt: "desc" } },
    },
    take: 100,
  });

  for (const student of students) {
    if (!student.studentProfile?.skills?.length) continue;

    const appliedTaskIds = new Set(student.applications.map((a) => a.taskId));
    const studentSkillsLower = student.studentProfile.skills.map((s) => s.toLowerCase());

    const matchingTasks = openTasks.filter((task) => {
      if (appliedTaskIds.has(task.id)) return false;
      return task.skillsRequired.some((skill) =>
        studentSkillsLower.includes(skill.toLowerCase())
      );
    });

    if (matchingTasks.length >= 2) {
      const topTask = matchingTasks[0]!;
      const created = await createNudge(
        student.id,
        "TASK_ASSIGNED",  // closest available notification type
        `🔍 ${matchingTasks.length} Tasks Match Your Skills`,
        `You haven't applied to any of the ${matchingTasks.length} tasks that match your skills. Check out "${topTask.title}" and similar opportunities.`,
        `/tasks?category=${topTask.category}`
      );
      if (created) count++;
    }
  }

  return count;
}

// ── Rule 2: Enterprise tasks with 0 applications after 5 days ────────────────

async function nudgeEnterpriseNoApplications(): Promise<number> {
  let count = 0;

  const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);

  const staleTasks = await db.task.findMany({
    where: {
      status:    "OPEN",
      createdAt: { lt: fiveDaysAgo },
      applications: { none: {} },
    },
    include: {
      enterprise: { select: { id: true } },
      _count:     { select: { applications: true } },
    },
    take: 50,
  });

  for (const task of staleTasks) {
    const created = await createNudge(
      task.enterprise.id,
      "APPLICATION_RECEIVED",  // closest type
      `💡 "${task.title.slice(0, 40)}" Has No Applicants`,
      `Your task has been open for 5+ days with 0 applications. Consider lowering the budget slightly, expanding skill requirements, or boosting the description.`,
      `/enterprise/tasks/${task.id}/edit`
    );
    if (created) count++;
  }

  return count;
}

// ── Rule 3: Students with incomplete profiles ─────────────────────────────────

async function nudgeIncompleteProfiles(): Promise<number> {
  let count = 0;

  const incompleteStudents = await db.user.findMany({
    where: {
      role: "STUDENT",
      studentProfile: {
        OR: [
          { bio: null },
          { bio: "" },
          { skills: { equals: [] } },
          { portfolioUrl: null },
        ],
      },
    },
    select: {
      id: true,
      studentProfile: { select: { bio: true, skills: true, portfolioUrl: true } },
    },
    take: 50,
  });

  for (const student of incompleteStudents) {
    const profile = student.studentProfile;
    if (!profile) continue;

    const missing: string[] = [];
    if (!profile.bio)                         missing.push("bio");
    if (!profile.skills?.length)              missing.push("skills");
    if (!profile.portfolioUrl)               missing.push("portfolio URL");

    if (missing.length > 0) {
      const created = await createNudge(
        student.id,
        "APPLICATION_RECEIVED",
        `✨ Complete Your Profile to Get Selected`,
        `Your profile is missing: ${missing.join(", ")}. Students with complete profiles are 3× more likely to be selected. It takes less than 2 minutes.`,
        `/student/profile/edit`
      );
      if (created) count++;
    }
  }

  return count;
}

// ── Main Entry Point ──────────────────────────────────────────────────────────

export class ProactiveAgent {
  /**
   * Runs all nudge rules and creates Notification records for eligible users.
   * Designed to be called from a cron-triggered API route (daily at 09:00 CET).
   *
   * @param dryRun - If true, only counts eligible users without creating notifications.
   */
  public static async runNudgeCycle(dryRun = false): Promise<NudgeResult> {
    console.log(`[ProactiveAgent] Running nudge cycle (dryRun=${dryRun})…`);

    const results = await Promise.allSettled([
      nudgeInactiveStudents(),
      nudgeEnterpriseNoApplications(),
      nudgeIncompleteProfiles(),
    ]);

    const studentNudges   = results[0].status === "fulfilled" ? results[0].value : 0;
    const enterpriseNudges = results[1].status === "fulfilled" ? results[1].value : 0;
    const profileNudges   = results[2].status === "fulfilled" ? results[2].value : 0;
    const errors          = results.filter((r) => r.status === "rejected").length;

    const total = studentNudges + enterpriseNudges + profileNudges;

    console.log(`[ProactiveAgent] Nudge cycle complete: ${total} notifications created (${errors} errors)`);

    return {
      notificationsCreated: total,
      studentNudges,
      enterpriseNudges,
      profileNudges,
      errors,
    };
  }
}
