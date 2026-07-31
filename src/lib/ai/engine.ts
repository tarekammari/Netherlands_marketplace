/**
 * src/lib/ai/engine.ts
 *
 * TBAI v2 AI Engine — main orchestrator.
 * Routes a classified intent to the appropriate handler,
 * fetches live DB data, and composes a structured response.
 * Supports Full AI Mode with user memory and richer agent actions.
 *
 * Architecture:
 *   classifyIntent(message) → handler(context) → AIResponse
 */

import { db, getPrismaModel } from "@/lib/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = db as any;
import { classifyIntent, extractSearchTerms, extractCategory } from "./intent";
import { rankByQuery } from "./tfidf";
import { getInsight, getInsights, maybeTriggerLearning } from "./learner";
import { KNOWLEDGE_BASE, getAllByIntent } from "./knowledge-base";
import { centsToEur } from "@/lib/utils";
import { AgentExecutor, type AgentAction } from "./agent-executor";
import { getMemory, updateMemory, buildPersonalizationHint } from "./memory";

// ── Response Types ─────────────────────────────────────────────────────────────

export interface TaskCard {
  id:          string;
  title:       string;
  budget:      string;
  category:    string;
  deadline:    string;
  applyUrl:    string;
  companyName?: string;
  matchScore?:  number;
}

export interface AIResponse {
  text:             string;
  intent:           string;
  confidence:       number;
  taskCards?:       TaskCard[]    | undefined;
  actions?:         Array<{ label: string; url: string }> | undefined;
  agentActions?:    AgentAction[] | undefined;
  suggestedReplies?: string[]     | undefined;
  memoryUpdated?:   boolean       | undefined;
  language?:        "en" | "nl"   | undefined;
}

export interface ConversationMessage {
  role:    "user" | "assistant";
  content: string;
  intent?: string | undefined;
}

export interface AIContext {
  userId?:      string | undefined;
  userRole?:    string | undefined;
  sessionId?:   string | undefined;
  currentPage?: string | undefined;
  fullAIMode?:  boolean | undefined;
  history?:     ConversationMessage[] | undefined;
}

// ── Intent Handlers ────────────────────────────────────────────────────────────

async function handleGreeting(ctx: AIContext): Promise<AIResponse> {
  const roleHint = ctx.userRole === "STUDENT"
    ? "\n\n_I can see you're logged in as a **student**. I can help you find matching tasks, improve your profile, or understand how payouts work._"
    : ctx.userRole === "ENTERPRISE"
    ? "\n\n_I can see you're logged in as an **enterprise**. I can help you write better task listings, advise on budgets, or explain the escrow process._"
    : "";

  const kbEntry = KNOWLEDGE_BASE.find((e) => e.id === "greeting");
  let text = (kbEntry?.answer ?? "👋 Hi! I'm TBAI, TaskBridge's AI assistant. How can I help?") + roleHint;

  // Full AI Mode: enrich with memory personalization
  if (ctx.fullAIMode && ctx.userId) {
    const memory = await getMemory(ctx.userId);
    text += buildPersonalizationHint(memory);
  }

  const agentActions: AgentAction[] = [
    AgentExecutor.navigate("Browse Tasks", "/tasks", false, "🔍"),
    AgentExecutor.navigate("Register Free", "/register", false, "✨"),
  ];

  if (ctx.userRole === "STUDENT") {
    agentActions.push(AgentExecutor.viewDashboard("STUDENT"));
  } else if (ctx.userRole === "ENTERPRISE") {
    agentActions.push(AgentExecutor.viewDashboard("ENTERPRISE"));
  }

  return {
    text,
    intent:      "GREETING",
    confidence:  1,
    suggestedReplies: ctx.userRole === "ENTERPRISE"
      ? ["How do I post a task?", "What's a fair budget?", "Show my dashboard"]
      : ["Find tasks for me", "How does escrow work?", "Help me write a proposal"],
    agentActions,
    actions: [
      { label: "Browse Tasks",   url: "/tasks" },
      { label: "Register Free",  url: "/register" },
    ],
  };
}

async function handlePlatformFAQ(message: string, ctx: AIContext = {}): Promise<AIResponse> {
  const lower = message.toLowerCase();

  // Skip FAQ when user wants to navigate to a page
  const navResponse = buildNavigationResponse(message, ctx);
  if (navResponse) return navResponse;

  // If asking about the app, what it is for, or asking to introduce the app
  const isIntroQuery = /(app|platform|taskbridge|introduce|purpose|wahy|why|what\s+is|about\s+(this|the)\s+(app|platform))/i.test(lower);
  if (isIntroQuery) {
    const mainEntry = KNOWLEDGE_BASE.find((e) => e.id === "what_is_taskbridge");
    if (mainEntry) {
      return {
        text: mainEntry.answer,
        intent: "PLATFORM_FAQ",
        confidence: 0.95,
        actions: [
          { label: "Browse Tasks", url: "/tasks" },
          { label: "Register Free", url: "/register" },
        ],
      };
    }
  }

  const entries = KNOWLEDGE_BASE.filter((e) =>
    ["PLATFORM_FAQ", "ESCROW_HELP", "CONTRACT_HELP", "APPLY_HELP", "PROFILE_ADVICE"].includes(e.intent)
  );
  const scored = entries.map((e) => {
    const qTokens = e.question.toLowerCase().split(/\s+/);
    const hits = qTokens.filter((t) => lower.includes(t)).length;
    return { e, score: hits };
  }).sort((a, b) => b.score - a.score);

  const best = scored[0]?.e;
  return {
    text:       best?.answer ?? "I'm here to help! TaskBridge NL connects students with companies for short-term professional tasks.",
    intent:     "PLATFORM_FAQ",
    confidence: 0.7,
  };
}

async function handleTaskSearch(message: string, ctx: AIContext): Promise<AIResponse> {
  const query    = extractSearchTerms(message);
  const category = extractCategory(message);

  // Full AI Mode: load user memory for personalized ranking
  let memorySkills: string[] = [];
  let memoryCategories: string[] = [];
  if (ctx.fullAIMode && ctx.userId) {
    const memory = await getMemory(ctx.userId);
    memorySkills     = memory.preferredSkills;
    memoryCategories = memory.preferredCategories;
  }

  const effectiveCategory = category ?? (memoryCategories[0] ?? null);

  // Get tasks with their stored vectors (resilient)
  let tasksWithVectors: any[] = [];
  try {
    const taskVectorModel = getPrismaModel("AITaskVector");
    if (taskVectorModel) {
      tasksWithVectors = await taskVectorModel.findMany({
        include: { task: { select: { id: true, title: true, budgetCents: true, category: true, deadline: true, status: true } } },
      });
    }
  } catch (err) {
    console.warn("[TBAI Engine] AITaskVector lookup skipped:", err);
  }

  const openWithVectors = tasksWithVectors.filter((t: any) => t.task.status === "OPEN");

  let ranked: string[] = [];
  if (openWithVectors.length > 0 && query.length > 2) {
    const candidates = openWithVectors.map((t: any) => ({
      id:        t.taskId,
      keywords:  t.keywords,
      tfidfJson: t.tfidfJson as Record<string, number>,
    }));
    ranked = rankByQuery(query, candidates).slice(0, 5).map((r) => r.id);
  }

  let matchedTasks = await db.task.findMany({
    where: {
      status: "OPEN",
      ...(effectiveCategory ? { category: effectiveCategory as never } : {}),
      ...(ranked.length > 0 ? { id: { in: ranked } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take:    3,
    include: { enterprise: { select: { enterpriseProfile: { select: { companyName: true } } } } },
  });

  if (matchedTasks.length === 0) {
    matchedTasks = await db.task.findMany({
      where:   { status: "OPEN" },
      orderBy: { createdAt: "desc" },
      take:    3,
      include: { enterprise: { select: { enterpriseProfile: { select: { companyName: true } } } } },
    });
  }

  const taskCards: TaskCard[] = matchedTasks.map((t) => ({
    id:          t.id,
    title:       t.title,
    budget:      centsToEur(t.budgetCents),
    category:    t.category.replace(/_/g, " "),
    deadline:    t.deadline.toLocaleDateString("nl-NL"),
    applyUrl:    `/tasks/${t.id}`,
    companyName: (t as any).enterprise?.enterpriseProfile?.companyName ?? "Verified Enterprise",
  }));

  const intro = matchedTasks.length > 0
    ? `🔍 I found **${matchedTasks.length} task${matchedTasks.length > 1 ? "s" : ""}** that match${matchedTasks.length === 1 ? "es" : ""} your query:\n`
    : "I couldn't find tasks matching that specific query right now. Here are the latest open tasks:";

  // Build agent actions
  const agentActions: AgentAction[] = [
    AgentExecutor.navigate("Browse All Tasks", "/tasks", false, "📋"),
  ];

  if (effectiveCategory) {
    agentActions.push(AgentExecutor.filterCategory(effectiveCategory));
  }

  if (ctx.userRole === "STUDENT" && taskCards[0]) {
    agentActions.push(AgentExecutor.applyNow(taskCards[0].id));
    agentActions.push(AgentExecutor.draftProposal(taskCards[0].id, taskCards[0].title));
  }

  // Update memory with search signal
  if (ctx.userId) {
    updateMemory(ctx.userId, {
      category: effectiveCategory ?? undefined,
      skills:   memorySkills,
      intent:   "TASK_SEARCH",
    }).catch(() => {});
  }

  return {
    text:        intro,
    intent:      "TASK_SEARCH",
    confidence:  0.85,
    taskCards,
    agentActions,
    actions:     [{ label: "Browse All Tasks", url: "/tasks" }],
    memoryUpdated: !!ctx.userId,
  };
}

async function handleBudgetAdvice(message: string, ctx: AIContext): Promise<AIResponse> {
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

    if (ctx.userId) {
      updateMemory(ctx.userId, { category, intent: "BUDGET_ADVICE" }).catch(() => {});
    }

    return {
      text: `💰 **${category.replace(/_/g, " ")} Budget Intelligence** _(learned from real TaskBridge data)_\n\n` +
        `📊 **Average budget:** ${avg}\n` +
        `📉 **Budget range:** ${low} – ${high}\n\n` +
        `🔑 **Top skills in demand:** ${topSkills.split(",").slice(0, 5).join(", ")}\n\n` +
        `_This is based on real transactions on the TaskBridge platform and improves as more tasks are completed._`,
      intent:      "BUDGET_ADVICE",
      confidence:  0.88,
      agentActions: [
        AgentExecutor.filterCategory(category),
        AgentExecutor.navigate("Browse Tasks", `/tasks?category=${category}`, false, "🔍"),
      ],
      actions: [{ label: "Browse Tasks", url: `/tasks` }],
    };
  }

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
      `🔥 Most popular category right now: **${popular.replace(/_/g, " ")}**\n\n` +
      `_Tell me which category you're working with for more specific advice._`,
    intent:    "BUDGET_ADVICE",
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
      `🔥 **Most Popular Category:** ${topCategory.replace(/_/g, " ")}\n\n` +
      `_Stats update automatically as the platform grows._`,
    intent:     "STATS_REQUEST",
    confidence: 0.95,
    agentActions: [
      AgentExecutor.navigate("Browse Tasks", "/tasks", false, "🔍"),
    ],
    actions: [{ label: "Browse Tasks", url: "/tasks" }],
  };
}

async function handleKnowledgeBase(intent: string, message: string): Promise<AIResponse> {
  const entries = KNOWLEDGE_BASE.filter((e) => e.intent === intent);
  if (entries.length === 0) {
    return handlePlatformFAQ(message);
  }
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

async function handleProposalHelp(message: string, ctx: AIContext): Promise<AIResponse> {
  const taskId = message.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)?.[0];

  // If a specific taskId is mentioned, try to load the task
  if (taskId) {
    try {
      const task = await db.task.findUnique({
        where: { id: taskId },
        select: { id: true, title: true, description: true, category: true, skillsRequired: true, budgetCents: true },
      });

      if (task) {
        const skillsNeeded = task.skillsRequired.slice(0, 4).join(", ");
        const budget = centsToEur(task.budgetCents);
        return {
          text: `📝 **Proposal Skeleton for "${task.title}"**\n\n` +
            `Here's a strong cover letter framework tailored to this task:\n\n` +
            `---\n\n` +
            `**Opening (2 sentences):**\n` +
            `"I'm excited to apply for the **${task.title}** task. My background in [your relevant experience] makes me well-suited to deliver exactly what you need."\n\n` +
            `**Why you (3-4 sentences):**\n` +
            `Highlight your experience with: **${skillsNeeded || task.category}**.\n` +
            `Mention 1-2 specific past projects. Quantify if possible ("improved conversion by 23%").\n\n` +
            `**Your approach:**\n` +
            `Briefly explain HOW you'd tackle this task in 2-3 concrete steps.\n\n` +
            `**Budget & timeline:**\n` +
            `The listed budget is **${budget}**. Match or justify your proposed rate with clear reasoning.\n\n` +
            `**Closing:**\n` +
            `"I'd love to discuss how I can deliver [specific deliverable]. Looking forward to hearing from you."\n\n` +
            `---\n_💡 Pro tip: Enterprises prefer concrete, concise proposals. Aim for 200–300 words._`,
          intent:     "PROPOSAL_HELP",
          confidence: 0.9,
          agentActions: [
            AgentExecutor.applyNow(task.id),
            AgentExecutor.navigate("View Task Details", `/tasks/${task.id}`, false, "👁️"),
          ],
        };
      }
    } catch { /* fallthrough to generic */ }
  }

  // Generic proposal writing guide
  return {
    text: `📝 **How to Write a Winning Proposal on TaskBridge**\n\n` +
      `**The formula that gets students selected:**\n\n` +
      `1️⃣ **Open with impact** — Name the task and your strongest relevant credential.\n\n` +
      `2️⃣ **Show proof** — Reference 1-2 specific past projects (link your portfolio!).\n\n` +
      `3️⃣ **Explain your approach** — Enterprises love structure. Mention 2-3 concrete steps.\n\n` +
      `4️⃣ **Address the budget** — If you're matching their price, say so. If proposing different, justify briefly.\n\n` +
      `5️⃣ **Strong close** — Ask a question or state a specific deliverable you'll produce.\n\n` +
      `📏 **Ideal length:** 200–350 words. Never copy-paste generic templates.\n\n` +
      `_Share a task ID and I'll generate a custom skeleton proposal for you!_`,
    intent:     "PROPOSAL_HELP",
    confidence: 0.88,
    agentActions: [
      AgentExecutor.navigate("Browse Open Tasks", "/tasks", false, "🔍"),
    ],
  };
}

async function handleDashboardRequest(ctx: AIContext): Promise<AIResponse> {
  if (!ctx.userId) {
    return {
      text: `📋 **Your Personal Dashboard**\n\nTo see your personalized summary, please **log in** first.\n\n_I can see stats for your tasks, applications, and earnings once you're signed in._`,
      intent:     "DASHBOARD_REQUEST",
      confidence: 0.8,
      agentActions: [
        AgentExecutor.navigate("Log In", "/login", true, "🔐"),
        AgentExecutor.navigate("Register Free", "/register", false, "✨"),
      ],
    };
  }

  try {
    const role = ctx.userRole ?? "STUDENT";

    if (role === "STUDENT") {
      const [applications, student] = await Promise.all([
        db.application.findMany({
          where:   { studentId: ctx.userId },
          orderBy: { createdAt: "desc" },
          take:    5,
          include: { task: { select: { title: true, status: true, budgetCents: true } } },
        }),
        db.studentProfile.findUnique({
          where: { userId: ctx.userId },
          select: { completedTaskCount: true, avgRating: true, totalReviewCount: true },
        }),
      ]);

      const pending  = applications.filter((a) => a.status === "PENDING").length;
      const selected = applications.filter((a) => a.status === "SELECTED").length;

      const memory = ctx.fullAIMode ? await getMemory(ctx.userId) : null;
      const personalization = memory ? buildPersonalizationHint(memory) : "";

      return {
        text: `📋 **Your Student Dashboard Summary**\n\n` +
          `📄 **Recent Applications:** ${applications.length}\n` +
          `⏳ **Awaiting Response:** ${pending}\n` +
          `✅ **Selected for Tasks:** ${selected}\n` +
          `🏆 **Completed Tasks:** ${student?.completedTaskCount ?? 0}\n` +
          `⭐ **Average Rating:** ${student?.avgRating?.toFixed(1) ?? "—"} (${student?.totalReviewCount ?? 0} reviews)\n\n` +
          (applications.length > 0
            ? `**Latest:** "${applications[0]!.task.title}" — _${applications[0]!.status}_`
            : "_You haven't applied to any tasks yet. Let me find some matching ones!_") +
          personalization,
        intent:     "DASHBOARD_REQUEST",
        confidence: 0.9,
        agentActions: [
          AgentExecutor.viewDashboard("STUDENT"),
          AgentExecutor.navigate("Find Matching Tasks", "/tasks", false, "🔍"),
          AgentExecutor.viewProfile("STUDENT"),
        ],
      };
    }

    if (role === "ENTERPRISE") {
      const tasks = await db.task.findMany({
        where:   { enterpriseId: ctx.userId },
        orderBy: { createdAt: "desc" },
        take:    5,
        include: { _count: { select: { applications: true } } },
      });

      const open    = tasks.filter((t) => t.status === "OPEN").length;
      const inProg  = tasks.filter((t) => t.status === "IN_PROGRESS").length;
      const done    = tasks.filter((t) => t.status === "COMPLETED").length;
      const totalApps = tasks.reduce((s, t) => s + (t as any)._count.applications, 0);

      return {
        text: `📋 **Your Enterprise Dashboard Summary**\n\n` +
          `💼 **Total Tasks Posted:** ${tasks.length}\n` +
          `🟢 **Open (accepting applications):** ${open}\n` +
          `⚙️ **In Progress:** ${inProg}\n` +
          `✅ **Completed:** ${done}\n` +
          `📨 **Total Applications Received:** ${totalApps}\n\n` +
          (tasks.length > 0
            ? `**Latest task:** "${tasks[0]!.title}" — _${tasks[0]!.status}_`
            : "_You haven't posted any tasks yet. Want to post your first brief?_"),
        intent:     "DASHBOARD_REQUEST",
        confidence: 0.9,
        agentActions: [
          AgentExecutor.viewDashboard("ENTERPRISE"),
          AgentExecutor.navigate("Post New Task", "/enterprise/tasks/new", false, "📝"),
        ],
      };
    }
  } catch { /* fallthrough to generic */ }

  return {
    text: `📋 **Dashboard**\n\nI'm having trouble loading your data right now. Please visit your dashboard directly.`,
    intent:     "DASHBOARD_REQUEST",
    confidence: 0.6,
    agentActions: [
      AgentExecutor.viewDashboard(ctx.userRole ?? "STUDENT"),
    ],
  };
}

// ── Conversation helpers ───────────────────────────────────────────────────────

function getLastAssistantTurn(history: ConversationMessage[]): ConversationMessage | null {
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i]!.role === "assistant") return history[i]!;
  }
  return null;
}

function searchKnowledgeBase(message: string): { answer: string; intent: string } | null {
  const lower = message.toLowerCase();
  let best: { answer: string; intent: string; score: number } | null = null;

  for (const entry of KNOWLEDGE_BASE) {
    const tokens = entry.question.toLowerCase().split(/\s+/).filter((t) => t.length > 3);
    const hits = tokens.filter((t) => lower.includes(t)).length;
    const answerTokens = entry.answer.toLowerCase().split(/\s+/).filter((t) => t.length > 4);
    const answerHits = answerTokens.filter((t) => lower.includes(t)).length;
    const score = hits * 2 + answerHits;
    if (score > 0 && (!best || score > best.score)) {
      best = { answer: entry.answer, intent: entry.intent, score };
    }
  }
  return best ? { answer: best.answer, intent: best.intent } : null;
}

async function handleFollowUp(message: string, ctx: AIContext): Promise<AIResponse> {
  const history = ctx.history ?? [];
  const lastTurn = getLastAssistantTurn(history);
  const lower = message.toLowerCase().trim();

  // Gratitude / acknowledgment — warm close with next-step suggestions
  if (/^(thanks|thank you|dank je|bedankt|got it|understood|i see|makes sense|perfect|great|awesome)/i.test(lower)) {
    const replies = ctx.userRole === "ENTERPRISE"
      ? ["How do I post a task?", "What's a fair budget?", "Show my dashboard"]
      : ["Find tasks for me", "Help me write a proposal", "Show my dashboard"];
    return {
      text: "You're welcome! If anything else comes up about TaskBridge — tasks, payments, or your profile — I'm here to help.\n\nIs there something specific you'd like to explore next?",
      intent:     "FOLLOW_UP",
      confidence: 0.95,
      suggestedReplies: replies,
      agentActions: [
        AgentExecutor.navigate("Browse Tasks", "/tasks", false, "🔍"),
      ],
    };
  }

  // Expand on the previous topic using last intent
  const lastIntent = lastTurn?.intent ?? "PLATFORM_FAQ";

  const followUpMap: Record<string, { text: string; suggestedReplies: string[] }> = {
    TASK_SEARCH: {
      text: "Here are a few ways to narrow your search:\n\n" +
        "• Mention a **skill** (e.g. \"React tasks\" or \"UX design\")\n" +
        "• Specify a **category** — Research, Design, Development, Marketing\n" +
        "• Ask for tasks within a **budget range** (e.g. \"tasks under €800\")\n\n" +
        "Would you like me to search again with a more specific query?",
      suggestedReplies: ["Find design tasks", "Show development tasks", "Tasks under €1000"],
    },
    BUDGET_ADVICE: {
      text: "Budget depends on scope, complexity, and deadline. A few guidelines:\n\n" +
        "• **Research tasks** typically run €400–€1,200\n" +
        "• **Design projects** range €500–€1,800\n" +
        "• **Development work** often starts at €800+\n\n" +
        "Tell me your project type and I can give a tighter estimate based on real platform data.",
      suggestedReplies: ["Budget for research", "Budget for design", "Budget for development"],
    },
    ESCROW_HELP: {
      text: "To recap the payment flow:\n\n" +
        "1. Enterprise locks funds in **Stripe escrow** when selecting you\n" +
        "2. You complete milestones and submit deliverables\n" +
        "3. Enterprise approves → **90%** transfers to your bank within 1–3 days\n" +
        "4. If no response in **7 days**, funds auto-release to you\n\n" +
        "Want details on contracts, milestones, or dispute handling?",
      suggestedReplies: ["How do contracts work?", "When do I get paid?", "Is payment safe?"],
    },
    PROPOSAL_HELP: {
      text: "Strong proposals share three things:\n\n" +
        "• **Proof** — one concrete past project with a measurable result\n" +
        "• **Approach** — 2–3 steps you'll take to deliver\n" +
        "• **Clarity** — match or justify the listed budget\n\n" +
        "Share a task title or paste a task link and I'll draft a tailored skeleton for you.",
      suggestedReplies: ["Find tasks to apply to", "Profile tips", "Show my applications"],
    },
    PLATFORM_FAQ: {
      text: "TaskBridge connects **students** with **companies** for short professional assignments.\n\n" +
        "Students build portfolio work and get paid through secure escrow. Companies access vetted talent without full-time hiring overhead.\n\n" +
        "What aspect would you like to dive into — getting started, payments, or finding work?",
      suggestedReplies: ["How do I get started?", "How does escrow work?", "Find tasks for me"],
    },
    DASHBOARD_REQUEST: {
      text: "Your dashboard shows applications, active tasks, earnings, and profile stats.\n\n" +
        "If you're logged in, I can pull a live summary. Otherwise, sign in and ask again — or tell me what you'd like to track.",
      suggestedReplies: ["Show my dashboard", "Find matching tasks", "Profile tips"],
    },
    PROFILE_ADVICE: {
      text: "Top profiles typically include:\n\n" +
        "• A focused **bio** tied to your study field\n" +
        "• **Specific skills** (Python, Figma — not just \"IT\")\n" +
        "• A **portfolio link** (GitHub, Behance, LinkedIn)\n" +
        "• **Stripe payout** connected and ready\n\n" +
        "Which area would you like to improve first?",
      suggestedReplies: ["Find tasks for my skills", "Help me write a proposal", "Platform stats"],
    },
  };

  const expansion = followUpMap[lastIntent] ?? followUpMap.PLATFORM_FAQ!;

  // "Yes" / affirmative — act on previous suggestion
  if (/^(yes|yeah|yep|sure|please|ok|okay|go ahead|do it|absolutely|definitely|sounds good|that works)/i.test(lower)) {
    if (lastIntent === "TASK_SEARCH") {
      return handleTaskSearch("find me tasks matching my skills", ctx);
    }
    if (lastIntent === "DASHBOARD_REQUEST") {
      return handleDashboardRequest(ctx);
    }
    if (lastIntent === "BUDGET_ADVICE") {
      return handleBudgetAdvice("budget advice for research", ctx);
    }
  }

  return {
    text:       expansion.text,
    intent:     "FOLLOW_UP",
    confidence: 0.88,
    suggestedReplies: expansion.suggestedReplies,
  };
}

async function handleConversation(message: string, ctx: AIContext): Promise<AIResponse> {
  const kbMatch = searchKnowledgeBase(message);

  if (kbMatch) {
    const related = getAllByIntent(kbMatch.intent).filter((e) => e.answer !== kbMatch.answer);
    const extra = related.length > 0
      ? `\n\n_Related:_ ${related[0]!.question}_`
      : "";

    return {
      text:       kbMatch.answer + extra + "\n\nDoes that answer your question, or would you like me to go deeper on a specific part?",
      intent:     "CONVERSATION",
      confidence: 0.82,
      suggestedReplies: ["Tell me more", "Find related tasks", "Something else"],
      actions:    [{ label: "Browse Tasks", url: "/tasks" }],
    };
  }

  const roleContext = ctx.userRole === "STUDENT"
    ? "As a student, you might want to focus on finding tasks, writing strong proposals, and setting up payouts."
    : ctx.userRole === "ENTERPRISE"
    ? "As an enterprise, you might want to focus on posting clear task briefs, setting fair budgets, and reviewing applications."
    : "Whether you're a student looking for work or a company hiring talent, I can guide you through the platform.";

  return {
    text: `Good question. ${roleContext}\n\n` +
      "I can help with:\n" +
      "• **Finding tasks** that match your skills\n" +
      "• **Budget guidance** based on real platform data\n" +
      "• **Escrow & contracts** — how payments stay protected\n" +
      "• **Profile & proposal tips** to stand out\n\n" +
      "What would you like to discuss? The more specific you are, the better I can assist.",
    intent:     "CONVERSATION",
    confidence: 0.75,
    suggestedReplies: [
      "Find tasks for me",
      "How does escrow work?",
      "Help me write a proposal",
      "What's a fair budget?",
    ],
    agentActions: [
      AgentExecutor.navigate("Browse Tasks", "/tasks", false, "🔍"),
      AgentExecutor.navigate("Register Free", "/register", false, "✨"),
    ],
  };
}

function buildNavigationResponse(message: string, ctx: AIContext): AIResponse | null {
  const target = AgentExecutor.resolveNavigationTarget(message, ctx.userRole);
  if (!target) return null;

  const alreadyThere = ctx.currentPage === target.url ||
    (target.url !== "/" && ctx.currentPage?.startsWith(target.url));

  if (alreadyThere) {
    return {
      text: `You're already on the **${target.label}** page. Is there anything specific you'd like to know about it?`,
      intent:     "NAVIGATION",
      confidence: 0.95,
      suggestedReplies: ["Find tasks for me", "How does escrow work?", "Open Contact page"],
    };
  }

  return {
    text: `Opening **${target.label}** now…`,
    intent:     "NAVIGATION",
    confidence: 0.98,
    agentActions: [
      AgentExecutor.navigate(`Open ${target.label}`, target.url, true, "🔗"),
    ],
    actions: [{ label: target.label, url: target.url }],
    suggestedReplies: ["Open Contact page", "Open Pricing page", "Find tasks for me"],
  };
}

async function handleNavigation(message: string, ctx: AIContext): Promise<AIResponse> {
  const response = buildNavigationResponse(message, ctx);
  if (response) return response;

  return {
    text: "I couldn't find that page. Here are pages I can open for you:\n\n" +
      "• **About Us** · **Contact** · **Pricing** · **FAQ**\n" +
      "• **Tasks** · **Login** · **Register**\n\n" +
      "Try: _\"Open the About Us page\"_ or _\"Go to pricing\"_",
    intent:     "NAVIGATION",
    confidence: 0.5,
    suggestedReplies: ["Open About Us", "Open Contact page", "Open Pricing page", "Open Tasks"],
  };
}

function handleUnknown(message?: string, ctx: AIContext = {}): AIResponse {
  if (message) {
    const nav = buildNavigationResponse(message, ctx);
    if (nav) return nav;
  }

  if (message && /(app|platform|taskbridge|introduce|purpose|wahy|why|what\s+is)/i.test(message) &&
      !/\b(open|go to|page|visit|navigate)\b/i.test(message)) {
    const mainEntry = KNOWLEDGE_BASE.find((e) => e.id === "what_is_taskbridge");
    if (mainEntry) {
      return {
        text: mainEntry.answer,
        intent: "PLATFORM_FAQ",
        confidence: 0.9,
        actions: [
          { label: "Browse Tasks", url: "/tasks" },
          { label: "Register Free", url: "/register" },
        ],
      };
    }
  }

  return {
    text: "I'd like to help — could you tell me a bit more about what you're looking for?\n\n" +
      "For example, you can ask me to:\n" +
      "• Find tasks matching your skills\n" +
      "• Explain how escrow payments work\n" +
      "• Suggest a fair budget for your project type\n" +
      "• Help draft a winning proposal\n" +
      "• Show your dashboard summary\n\n" +
      "Try rephrasing your question, or pick one of the suggestions below.",
    intent:     "UNKNOWN",
    confidence: 0,
    suggestedReplies: [
      "Find tasks for me",
      "How does escrow work?",
      "What's a fair budget?",
      "Help me write a proposal",
    ],
    agentActions: [
      AgentExecutor.navigate("Browse Tasks",  "/tasks",    false, "🔍"),
      AgentExecutor.navigate("Register Free", "/register", false, "✨"),
    ],
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
  const { intent, entities } = classification;

  // Fire-and-forget: log event and maybe trigger learning
  try {
    const aiEventModel = getPrismaModel("AIEvent");
    if (aiEventModel) {
      aiEventModel.create({
        data: {
          userId:    ctx.userId,
          eventType: "CHAT_MESSAGE",
          payload:   {
            intent,
            messageLength: message.length,
            sessionId:     ctx.sessionId,
            fullAIMode:    ctx.fullAIMode ?? false,
            entities:      { category: entities.category, skillCount: entities.skills.length },
          },
          sessionId: ctx.sessionId,
        },
      }).catch(() => {});
    }
  } catch {}

  maybeTriggerLearning().catch(() => {});

  // Full AI Mode: also resolve a query-level agent action
  const queryAction = AgentExecutor.resolveQueryAction(message, ctx.userRole);

  // Route to handler
  let response: AIResponse;
  switch (intent) {
    case "GREETING":          response = await handleGreeting(ctx);                          break;
    case "FOLLOW_UP":         response = await handleFollowUp(message, ctx);                 break;
    case "CONVERSATION":      response = await handleConversation(message, ctx);             break;
    case "NAVIGATION":        response = await handleNavigation(message, ctx);               break;
    case "TASK_SEARCH":       response = await handleTaskSearch(message, ctx);               break;
    case "BUDGET_ADVICE":     response = await handleBudgetAdvice(message, ctx);             break;
    case "STATS_REQUEST":     response = await handleStatsRequest();                         break;
    case "ESCROW_HELP":       response = await handleKnowledgeBase("ESCROW_HELP",    message); break;
    case "CONTRACT_HELP":     response = await handleKnowledgeBase("CONTRACT_HELP",  message); break;
    case "APPLY_HELP":        response = await handleKnowledgeBase("APPLY_HELP",     message); break;
    case "POST_TASK_HELP":    response = await handleKnowledgeBase("POST_TASK_HELP", message); break;
    case "PROFILE_ADVICE":    response = await handleKnowledgeBase("PROFILE_ADVICE", message); break;
    case "PLATFORM_FAQ":      response = await handlePlatformFAQ(message, ctx);                  break;
    case "PROPOSAL_HELP":     response = await handleProposalHelp(message, ctx);            break;
    case "DASHBOARD_REQUEST": response = await handleDashboardRequest(ctx);                  break;
    default:                  response = handleUnknown(message, ctx);                             break;
  }

  // Merge query-level agent actions (navigation auto-executes regardless of AI mode)
  if (queryAction) {
    const existing = response.agentActions ?? [];
    const isDuplicate = queryAction.url && existing.some((a) => a.url === queryAction.url);
    if (!isDuplicate) {
      response.agentActions = [...existing, queryAction];
    }
    if (queryAction.autoExecute && queryAction.url && response.intent !== "NAVIGATION") {
      response.text = response.text.replace(/\.\s*$/, "") + `\n\nOpening **${queryAction.label.replace(/^Open /, "")}** now…`;
    }
  }

  // Attach language hint from entity extraction
  response.language = entities.language;

  // Update memory for logged-in users in Full AI Mode
  if (ctx.userId && ctx.fullAIMode) {
    updateMemory(ctx.userId, {
      category:  entities.category ?? undefined,
      skills:    entities.skills,
      intent,
      budgetHint: entities.budgetHint ?? undefined,
    }).catch(() => {});
    response.memoryUpdated = true;
  }

  return response;
}
