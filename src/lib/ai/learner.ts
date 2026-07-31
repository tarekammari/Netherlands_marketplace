/**
 * src/lib/ai/learner.ts
 *
 * TBAI Behavioral Learning Engine.
 * Aggregates raw AIEvent data into AIInsight records.
 *
 * Runs on-demand (triggered every N events) or via cron.
 * All learning is stored in PostgreSQL — zero external dependencies.
 */

import { db, getPrismaModel } from "@/lib/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = db as any;

// ── How often to run insight aggregation (every N chat messages) ──────────────
const LEARN_EVERY_N_EVENTS = 20;

// ── Upsert a single insight ───────────────────────────────────────────────────

async function upsertInsight(
  key:        string,
  value:      string,
  confidence: number,
  sampleSize: number
) {
  try {
    const aiInsightModel = getPrismaModel("AIInsight");
    if (aiInsightModel) {
      await aiInsightModel.upsert({
        where:  { key },
        create: { key, value, confidence, sampleSize },
        update: { value, confidence, sampleSize },
      });
    }
  } catch {}
}

// ── Compute average budget by category ───────────────────────────────────────

async function learnBudgetByCategory() {
  const tasks = await db.task.findMany({
    where:   { status: { in: ["COMPLETED", "IN_PROGRESS", "ASSIGNED"] } },
    select:  { category: true, budgetCents: true },
  });

  const groups: Record<string, number[]> = {};
  for (const t of tasks) {
    (groups[t.category] ??= []).push(t.budgetCents);
  }

  for (const [category, budgets] of Object.entries(groups)) {
    if (budgets.length < 2) continue;
    const avg = budgets.reduce((s, v) => s + v, 0) / budgets.length;
    const confidence = Math.min(0.99, 0.5 + budgets.length * 0.025);
    await upsertInsight(`avg_budget_${category}`, Math.round(avg).toString(), confidence, budgets.length);
  }
}

// ── Compute top skills per category ──────────────────────────────────────────

async function learnTopSkills() {
  const tasks = await db.task.findMany({
    where:  { status: { in: ["COMPLETED", "ASSIGNED", "IN_PROGRESS", "OPEN"] } },
    select: { category: true, skillsRequired: true },
  });

  const skillGroups: Record<string, Record<string, number>> = {};
  for (const t of tasks) {
    const g = (skillGroups[t.category] ??= {});
    for (const skill of t.skillsRequired) {
      g[skill.toLowerCase()] = (g[skill.toLowerCase()] ?? 0) + 1;
    }
  }

  for (const [category, skills] of Object.entries(skillGroups)) {
    const topSkills = Object.entries(skills)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([k]) => k)
      .join(",");
    if (!topSkills) continue;
    const sampleSize = Object.values(skills).reduce((s, v) => s + v, 0);
    const confidence = Math.min(0.95, 0.4 + sampleSize * 0.02);
    await upsertInsight(`top_skills_${category}`, topSkills, confidence, sampleSize);
  }
}

// ── Compute apply success rate by university ──────────────────────────────────

async function learnUniversitySuccessRate() {
  const applications = await db.application.findMany({
    where:   { status: { in: ["SELECTED", "SHORTLISTED", "PENDING"] } },
    select:  { status: true, student: { select: { studentProfile: { select: { university: true } } } } },
  });

  const stats: Record<string, { selected: number; total: number }> = {};
  for (const app of applications) {
    const uni = app.student.studentProfile?.university;
    if (!uni) continue;
    const s = (stats[uni] ??= { selected: 0, total: 0 });
    s.total++;
    if (app.status === "SELECTED") s.selected++;
  }

  // Find leader
  let leader = { uni: "", rate: 0 };
  for (const [uni, s] of Object.entries(stats)) {
    if (s.total < 3) continue;
    const rate = s.selected / s.total;
    if (rate > leader.rate) leader = { uni, rate };
  }
  if (leader.uni) {
    await upsertInsight("apply_rate_leader", leader.uni, Math.min(0.9, leader.rate + 0.3), 
      Object.values(stats).reduce((s, v) => s + v.total, 0));
  }
}

// ── Compute most popular task category ───────────────────────────────────────

async function learnPopularCategories() {
  const groups = await db.task.groupBy({
    by:      ["category"],
    _count:  { id: true },
    orderBy: { _count: { id: "desc" } },
  });

  if (groups.length > 0) {
    const top = groups[0]!;
    await upsertInsight("popular_category", top.category, 0.85, top._count.id);

    // Also store ranked list
    const ranked = groups.map((g) => g.category).join(",");
    await upsertInsight("category_ranking", ranked, 0.9, groups.reduce((s, g) => s + g._count.id, 0));
  }
}

// ── Compute platform totals (for stats queries) ───────────────────────────────

async function learnPlatformStats() {
  const [tasks, students, enterprises, payments] = await Promise.all([
    db.task.count({ where: { status: "OPEN" } }),
    db.user.count({ where: { role: "STUDENT" } }),
    db.user.count({ where: { role: "ENTERPRISE" } }),
    db.payment.aggregate({ where: { status: "RELEASED" }, _sum: { studentAmountCents: true } }),
  ]);

  await Promise.all([
    upsertInsight("stat_open_tasks",    tasks.toString(),     0.99, tasks),
    upsertInsight("stat_students",      students.toString(),  0.99, students),
    upsertInsight("stat_enterprises",   enterprises.toString(),0.99, enterprises),
    upsertInsight("stat_total_paid",    (payments._sum.studentAmountCents ?? 0).toString(), 0.99, 1),
  ]);
}

// ── Main aggregation entry point ──────────────────────────────────────────────

export async function runLearningCycle(): Promise<void> {
  await Promise.allSettled([
    learnBudgetByCategory(),
    learnTopSkills(),
    learnUniversitySuccessRate(),
    learnPopularCategories(),
    learnPlatformStats(),
  ]);
}

// ── Check if we should trigger a learning cycle ───────────────────────────────

export async function maybeTriggerLearning(): Promise<void> {
  try {
    const aiEventModel = getPrismaModel("AIEvent");
    if (!aiEventModel) return;
    const count = await aiEventModel.count({
      where: { eventType: "CHAT_MESSAGE" },
    });
    if (count % LEARN_EVERY_N_EVENTS === 0) {
      runLearningCycle().catch(console.error);
    }
  } catch {}
}

// ── Read an insight value (with fallback) ─────────────────────────────────────

export async function getInsight(key: string, fallback = ""): Promise<string> {
  try {
    const aiInsightModel = getPrismaModel("AIInsight");
    if (!aiInsightModel) return fallback;
    const insight = await aiInsightModel.findUnique({ where: { key } });
    return insight?.value ?? fallback;
  } catch {
    return fallback;
  }
}

// ── Read multiple insights at once ────────────────────────────────────────────

export async function getInsights(keys: string[]): Promise<Record<string, string>> {
  try {
    const aiInsightModel = getPrismaModel("AIInsight");
    if (!aiInsightModel) return {};
    const insights = await aiInsightModel.findMany({
      where: { key: { in: keys } },
    });
    const result: Record<string, string> = {};
    for (const ins of insights) result[ins.key] = ins.value;
    return result;
  } catch {
    return {};
  }
}
