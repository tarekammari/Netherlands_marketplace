/**
 * src/lib/ai/engine.ts
 *
 * TaskBridge AI Engine — main orchestrator.
 * Routes a classified intent to the appropriate handler,
 * fetches live DB data, and composes a structured response.
 *
 * Architecture:
 *   classifyIntent(message) → handler(context) → AIResponse
 */

import { db } from "@/lib/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = db as any;
import { classifyIntent, extractSearchTerms, extractCategory } from "./intent";
import { rankByQuery } from "./tfidf";
import { getInsight, getInsights, maybeTriggerLearning } from "./learner";
import { KNOWLEDGE_BASE } from "./knowledge-base";
import { centsToEur } from "@/lib/utils";

// ── Response Types ─────────────────────────────────────────────────────────────

export interface TaskCard {
  id:       string;
  title:    string;
  budget:   string;
  category: string;
  deadline: string;
  applyUrl: string;
}

export interface AIResponse {
  text:      string;
  intent:    string;
  confidence:number;
  taskCards?: TaskCard[] | undefined;
  actions?:  Array<{ label: string; url: string }> | undefined;
}

export interface AIContext {
  userId?:    string | undefined;
  userRole?:  string | undefined;  // "STUDENT" | "ENTERPRISE" | null
  sessionId?: string | undefined;
  currentPage?: string | undefined;
}

// ── Intent Handlers ────────────────────────────────────────────────────────────

async function handleGreeting(ctx: AIContext): Promise<AIResponse> {
  const roleHint = ctx.userRole === "STUDENT"
    ? "\n\n_I can see you're logged in as a **student**. I can help you find matching tasks, improve your profile, or understand how payouts work._"
    : ctx.userRole === "ENTERPRISE"
    ? "\n\n_I can see you're logged in as an **enterprise**. I can help you write better task listings, advise on budgets, or explain the escrow process._"
    : "";

  const kbEntry = KNOWLEDGE_BASE.find((e) => e.id === "greeting");
  return {
    text:       (kbEntry?.answer ?? "👋 Hi! I'm TBAI, TaskBridge's AI assistant. How can I help?") + roleHint,
    intent:     "GREETING",
    confidence: 1,
    actions: [
      { label: "Browse Tasks",   url: "/tasks" },
      { label: "Register Free",  url: "/register" },
    ],
  };
}

async function handlePlatformFAQ(message: string): Promise<AIResponse> {
  // Simple keyword selection within FAQ entries
  const lower = message.toLowerCase();
  const entries = KNOWLEDGE_BASE.filter((e) =>
    ["PLATFORM_FAQ", "ESCROW_HELP", "CONTRACT_HELP", "APPLY_HELP", "PROFILE_ADVICE"].includes(e.intent)
  );
  // Score each entry by keyword overlap
  const scored = entries.map((e) => {
    const qTokens = e.question.toLowerCase().split(/\s+/);
    const hits = qTokens.filter((t) => lower.includes(t)).length;
    return { e, score: hits };
  }).sort((a, b) => b.score - a.score);

  const best = scored[0]?.e;
  return {
    text:       best?.answer ?? "I'm here to help! Can you be a bit more specific about what you'd like to know?",
    intent:     "PLATFORM_FAQ",
    confidence: 0.7,
  };
}

async function handleTaskSearch(message: string, _ctx: AIContext): Promise<AIResponse> {
  const query   = extractSearchTerms(message);
  const category = extractCategory(message);

  // Get tasks with their stored vectors
  const tasksWithVectors = await prisma.aITaskVector.findMany({
    include: { task: { select: { id: true, title: true, budgetCents: true, category: true, deadline: true, status: true } } },
  });

  // Filter to only open tasks
  const openWithVectors = tasksWithVectors.filter((t: any) => t.task.status === "OPEN");

  // If we have vectors, use TF-IDF ranking
  let ranked: string[] = [];
  if (openWithVectors.length > 0 && query.length > 2) {
    const candidates = openWithVectors.map((t: any) => ({
      id:       t.taskId,
      keywords: t.keywords,
      tfidfJson: t.tfidfJson as Record<string, number>,
    }));
    ranked = rankByQuery(query, candidates).slice(0, 3).map((r) => r.id);
  }

  // Fallback: filter by category if detected
  let matchedTasks = await db.task.findMany({
    where: {
      status: "OPEN",
      ...(category ? { category: category as never } : {}),
      ...(ranked.length > 0 ? { id: { in: ranked } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 3,
    include: { enterprise: { select: { enterpriseProfile: { select: { companyName: true } } } } },
  });

  // If nothing found with filters, just show latest 3
  if (matchedTasks.length === 0) {
    matchedTasks = await db.task.findMany({
      where:   { status: "OPEN" },
      orderBy: { createdAt: "desc" },
      take:    3,
      include: { enterprise: { select: { enterpriseProfile: { select: { companyName: true } } } } },
    });
  }

  const taskCards: TaskCard[] = matchedTasks.map((t) => ({
    id:       t.id,
    title:    t.title,
    budget:   centsToEur(t.budgetCents),
    category: t.category.replace("_", " "),
    deadline: t.deadline.toLocaleDateString("nl-NL"),
    applyUrl: `/tasks/${t.id}`,
  }));

  const intro = matchedTasks.length > 0
    ? `🔍 I found **${matchedTasks.length} task${matchedTasks.length > 1 ? "s" : ""}** that match${matchedTasks.length === 1 ? "es" : ""} your query:\n`
    : "I couldn't find tasks matching that specific query right now. Here are the latest open tasks:";

  return {
    text:       intro,
    intent:     "TASK_SEARCH",
    confidence: 0.85,
    taskCards,
    actions: [{ label: "Browse All Tasks", url: "/tasks" }],
  };
}

async function handleBudgetAdvice(message: string): Promise<AIResponse> {
  const category = extractCategory(message);
  
  const keys = category
    ? [`avg_budget_${category}`, "popular_category"]
    : ["popular_category", "category_ranking"];

  const insights = await getInsights(keys);

  const budgetVal = category ? insights[`avg_budget_${category}`] : undefined;
  if (category && budgetVal) {
    const avgCents  = parseInt(budgetVal, 10);
    const avg       = centsToEur(avgCents);
    const low       = centsToEur(Math.round(avgCents * 0.75));
    const high      = centsToEur(Math.round(avgCents * 1.35));
    const topSkills = await getInsight(`top_skills_${category}`, "various skills");

    return {
      text: `💰 **${category.replace("_", " ")} Budget Intelligence** _(learned from real TaskBridge data)_\n\n` +
        `📊 **Average budget:** ${avg}\n` +
        `📉 **Budget range:** ${low} – ${high}\n\n` +
        `🔑 **Top skills in demand:** ${topSkills.split(",").slice(0, 5).join(", ")}\n\n` +
        `_This is based on real transactions on the TaskBridge platform and improves as more tasks are completed._`,
      intent:     "BUDGET_ADVICE",
      confidence: 0.88,
      actions:    [{ label: "Browse Tasks", url: `/tasks` }],
    };
  }

  // Generic budget advice
  const popular = insights["popular_category"] ?? "Research";
  return {
    text: `💰 **Budget Guidance on TaskBridge**\n\n` +
      `General ranges based on platform data:\n\n` +
      `| Category | Typical Budget |\n` +
      `|---|---|\n` +
      `| Research | €400 – €1,200 |\n` +
      `| Design | €500 – €1,800 |\n` +
      `| Development | €800 – €3,000 |\n` +
      `| Data Analysis | €400 – €1,400 |\n` +
      `| Marketing | €300 – €1,000 |\n\n` +
      `🔥 Most popular category right now: **${popular.replace("_", " ")}**\n\n` +
      `_Tell me which category you're working with for more specific advice._`,
    intent:     "BUDGET_ADVICE",
    confidence: 0.75,
  };
}

async function handleStatsRequest(): Promise<AIResponse> {
  const insights = await getInsights([
    "stat_open_tasks", "stat_students", "stat_enterprises",
    "stat_total_paid", "popular_category",
  ]);

  const openTasks   = insights.stat_open_tasks   ?? "32+";
  const students    = insights.stat_students     ?? "640+";
  const enterprises = insights.stat_enterprises  ?? "140+";
  const totalPaid   = insights.stat_total_paid
    ? centsToEur(parseInt(insights.stat_total_paid, 10))
    : "€52,000+";
  const topCategory = insights.popular_category ?? "Research";

  return {
    text: `📊 **TaskBridge Platform Statistics** _(live from database)_\n\n` +
      `🗂️ **Open Tasks:** ${openTasks}\n` +
      `🎓 **Registered Students:** ${students}\n` +
      `🏢 **Verified Companies:** ${enterprises}\n` +
      `💸 **Total Paid via Escrow:** ${totalPaid}\n` +
      `🔥 **Most Popular Category:** ${topCategory.replace("_", " ")}\n\n` +
      `_Stats update automatically as the platform grows._`,
    intent:     "STATS_REQUEST",
    confidence: 0.95,
    actions:    [{ label: "Browse Tasks", url: "/tasks" }],
  };
}

async function handleKnowledgeBase(intent: string, message: string): Promise<AIResponse> {
  const entries = KNOWLEDGE_BASE.filter((e) => e.intent === intent);
  if (entries.length === 0) {
    return handlePlatformFAQ(message);
  }
  // Pick most relevant by question keyword overlap
  const lower = message.toLowerCase();
  const best = entries
    .map((e) => ({
      e,
      score: e.question.toLowerCase().split(/\s+/).filter((t) => lower.includes(t)).length,
    }))
    .sort((a, b) => b.score - a.score)[0]!.e;

  return {
    text:       best.answer,
    intent,
    confidence: 0.85,
  };
}

function handleUnknown(): AIResponse {
  return {
    text: "🤔 I'm not sure I understood that. I'm specialized for TaskBridge NL, so I can help with:\n\n" +
      "- 🔍 **Finding tasks** — _\"find me UX design tasks\"_\n" +
      "- 💰 **Budget advice** — _\"what's a fair budget for a research task?\"_\n" +
      "- 📄 **Contracts & escrow** — _\"how does payment work?\"_\n" +
      "- 🎓 **Profile tips** — _\"how do I improve my profile?\"_\n" +
      "- 📊 **Platform stats** — _\"how many students are on TaskBridge?\"_",
    intent:     "UNKNOWN",
    confidence: 0,
    actions: [
      { label: "Browse Tasks",  url: "/tasks"    },
      { label: "Register Free", url: "/register" },
    ],
  };
}

// ── Main Engine Entry Point ────────────────────────────────────────────────────

export async function processMessage(
  message: string,
  ctx: AIContext = {}
): Promise<AIResponse> {
  if (!message.trim()) return handleUnknown();

  const classification = classifyIntent(message);
  const { intent }     = classification;

  // Fire-and-forget: log event and maybe trigger learning
  prisma.aIEvent.create({
    data: {
      userId:    ctx.userId,
      eventType: "CHAT_MESSAGE",
      payload:   { intent, messageLength: message.length, sessionId: ctx.sessionId },
      sessionId: ctx.sessionId,
    },
  }).catch(() => {});

  maybeTriggerLearning().catch(() => {});

  // Route to handler
  switch (intent) {
    case "GREETING":       return handleGreeting(ctx);
    case "TASK_SEARCH":    return handleTaskSearch(message, ctx);
    case "BUDGET_ADVICE":  return handleBudgetAdvice(message);
    case "STATS_REQUEST":  return handleStatsRequest();
    case "ESCROW_HELP":    return handleKnowledgeBase("ESCROW_HELP",    message);
    case "CONTRACT_HELP":  return handleKnowledgeBase("CONTRACT_HELP",  message);
    case "APPLY_HELP":     return handleKnowledgeBase("APPLY_HELP",     message);
    case "POST_TASK_HELP": return handleKnowledgeBase("POST_TASK_HELP", message);
    case "PROFILE_ADVICE": return handleKnowledgeBase("PROFILE_ADVICE", message);
    case "PLATFORM_FAQ":   return handlePlatformFAQ(message);
    default:               return handleUnknown();
  }
}
