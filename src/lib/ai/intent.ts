/**
 * src/lib/ai/intent.ts
 *
 * Intent classifier for TBAI — pattern-based, no ML library required.
 * Classifies user messages into actionable intents the engine can handle.
 *
 * Intents:
 *   TASK_SEARCH      — User wants to find tasks matching skills/interests
 *   BUDGET_ADVICE    — User wants market rate / budget guidance
 *   PLATFORM_FAQ     — General how-it-works questions
 *   ESCROW_HELP      — Questions about payments and escrow
 *   CONTRACT_HELP    — Questions about contracts / legal
 *   APPLY_HELP       — How to apply for a task
 *   POST_TASK_HELP   — How to post a task (enterprise)
 *   PROFILE_ADVICE   — How to improve student/enterprise profile
 *   STATS_REQUEST    — Platform statistics query
 *   GREETING         — Hello/hi/hey
 *   UNKNOWN          — Fallback
 */

export type Intent =
  | "TASK_SEARCH"
  | "BUDGET_ADVICE"
  | "PLATFORM_FAQ"
  | "ESCROW_HELP"
  | "CONTRACT_HELP"
  | "APPLY_HELP"
  | "POST_TASK_HELP"
  | "PROFILE_ADVICE"
  | "STATS_REQUEST"
  | "GREETING"
  | "UNKNOWN";

interface IntentRule {
  intent:   Intent;
  patterns: RegExp[];
  weight:   number; // higher = preferred when multiple match
}

const RULES: IntentRule[] = [
  {
    intent:   "GREETING",
    weight:   1,
    patterns: [/^\s*(hi|hello|hey|hoi|goedemorgen|goedemiddag|hallo|sup|howdy)\b/i],
  },
  {
    intent:   "TASK_SEARCH",
    weight:   10,
    patterns: [
      /find\s+(me\s+)?(a\s+)?task/i,
      /show\s+(me\s+)?tasks/i,
      /looking\s+for\s+(a\s+)?task/i,
      /tasks?\s+(for|about|related\s+to|in)/i,
      /search\s+(for\s+)?task/i,
      /what\s+tasks?\s+(are|match)/i,
      /recommend\s+(a\s+)?task/i,
      /suitable\s+tasks?/i,
      /available\s+tasks?/i,
      /open\s+tasks?/i,
      /find\s+(work|project|assignment)/i,
    ],
  },
  {
    intent:   "BUDGET_ADVICE",
    weight:   9,
    patterns: [
      /how\s+much\s+(should|to)\s+(charge|pay|budget)/i,
      /budget\s+(for|advice|tip|range|guidance)/i,
      /fair\s+(price|rate|budget|pay)/i,
      /average\s+(pay|salary|rate|budget)/i,
      /market\s+rate/i,
      /what.*(pay|charge|budget).*(task|project|research|design)/i,
      /pricing\s+(for|advice)/i,
      /how\s+much.*earn/i,
    ],
  },
  {
    intent:   "ESCROW_HELP",
    weight:   9,
    patterns: [
      /escrow/i,
      /how.*pay(ment)?.*work/i,
      /when.*get\s+paid/i,
      /payment\s+(safe|protected|guarantee)/i,
      /stripe\s+connect/i,
      /milestone.*pay/i,
      /release.*fund/i,
      /fund.*lock/i,
    ],
  },
  {
    intent:   "CONTRACT_HELP",
    weight:   8,
    patterns: [
      /contract/i,
      /legal/i,
      /agreement/i,
      /sign(ature)?/i,
      /pdf.*document/i,
      /assignment.*document/i,
    ],
  },
  {
    intent:   "APPLY_HELP",
    weight:   8,
    patterns: [
      /how.*apply/i,
      /apply.*task/i,
      /submit.*application/i,
      /application.*process/i,
      /how\s+(to|do\s+i)\s+apply/i,
      /send.*application/i,
      /tips.*apply/i,
    ],
  },
  {
    intent:   "POST_TASK_HELP",
    weight:   8,
    patterns: [
      /how.*post.*task/i,
      /create.*task/i,
      /add.*listing/i,
      /publish.*task/i,
      /post.*project/i,
      /hire.*student/i,
      /find.*student/i,
    ],
  },
  {
    intent:   "PROFILE_ADVICE",
    weight:   7,
    patterns: [
      /improve.*profile/i,
      /profile\s+tip/i,
      /what.*put.*profile/i,
      /stand\s+out/i,
      /get\s+selected/i,
      /win\s+(more\s+)?tasks?/i,
      /better\s+(application|chance)/i,
    ],
  },
  {
    intent:   "STATS_REQUEST",
    weight:   6,
    patterns: [
      /how\s+many\s+(students|tasks|companies|enterprises)/i,
      /platform\s+stat/i,
      /total\s+(user|task|payment)/i,
      /number\s+of\s+(students|task)/i,
      /how\s+big\s+is/i,
    ],
  },
  {
    intent:   "PLATFORM_FAQ",
    weight:   5,
    patterns: [
      /how\s+does.*work/i,
      /what\s+is\s+task\s*bridge/i,
      /tell\s+me\s+about/i,
      /explain/i,
      /what\s+can\s+(i|you)\s+do/i,
      /help\s+me/i,
      /get\s+started/i,
      /how\s+to\s+start/i,
      /what.*commission/i,
      /fee/i,
    ],
  },
];

export interface ClassificationResult {
  intent:     Intent;
  confidence: number; // 0–1
  matched:    string; // which pattern matched
}

export function classifyIntent(message: string): ClassificationResult {
  const matches: Array<{ intent: Intent; weight: number; pattern: string }> = [];

  for (const rule of RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(message)) {
        matches.push({ intent: rule.intent, weight: rule.weight, pattern: pattern.source });
        break; // first match per rule is enough
      }
    }
  }

  if (matches.length === 0) {
    return { intent: "UNKNOWN", confidence: 0, matched: "" };
  }

  // Pick highest weight match; if tie, prefer later (more specific) rule
  const best = matches.sort((a, b) => b.weight - a.weight)[0]!;
  const confidence = Math.min(0.95, best.weight / 10);

  return { intent: best.intent, confidence, matched: best.pattern };
}

// ── Extract skill/category from a TASK_SEARCH message ─────────────────────────

export function extractSearchTerms(message: string): string {
  // Remove common framing words to get the core query
  return message
    .replace(/find\s+(me\s+)?(a\s+)?tasks?/i, "")
    .replace(/show\s+(me\s+)?tasks?/i, "")
    .replace(/looking\s+for/i, "")
    .replace(/search\s+for/i, "")
    .replace(/recommend/i, "")
    .replace(/about|related\s+to|in|for/i, "")
    .trim() || message;
}

// ── Extract budget category from a BUDGET_ADVICE message ──────────────────────

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  RESEARCH:      ["research", "analysis", "study", "survey", "report", "academic"],
  DESIGN:        ["design", "figma", "ui", "ux", "branding", "logo", "visual"],
  DATA_ANALYSIS: ["data", "excel", "analytics", "statistics", "python", "sql", "dataset"],
  MARKETING:     ["marketing", "social media", "seo", "content", "campaign", "ads"],
  DEVELOPMENT:   ["code", "programming", "develop", "software", "app", "website", "api"],
  WRITING:       ["write", "writing", "copy", "blog", "article", "content"],
  FINANCE:       ["finance", "financial", "accounting", "budget", "investment"],
  LEGAL:         ["legal", "contract", "compliance", "gdpr", "law"],
};

export function extractCategory(message: string): string | null {
  const lower = message.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return category;
  }
  return null;
}
