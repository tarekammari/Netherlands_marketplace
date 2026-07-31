/**
 * src/lib/ai/intent.ts
 *
 * TBAI v2 Intent Classifier — pattern-based, no ML library required.
 * Classifies user messages into actionable intents the engine can handle.
 * Includes entity extraction for skills, categories, budgets & task IDs.
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
 *   PROPOSAL_HELP    — Draft a cover letter / proposal for a task
 *   DASHBOARD_REQUEST — Show user's personal dashboard summary
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
  | "PROPOSAL_HELP"
  | "DASHBOARD_REQUEST"
  | "GREETING"
  | "FOLLOW_UP"
  | "CONVERSATION"
  | "NAVIGATION"
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
    patterns: [
      /^\s*(hi|hello|hey|hoi|goedemorgen|goedemiddag|hallo|sup|howdy|dag|goededag|hé|heej)\b/i,
    ],
  },
  {
    intent:   "NAVIGATION",
    weight:   15,
    patterns: [
      /open\s+(the\s+)?/i,
      /go\s+to\s+(the\s+)?/i,
      /take\s+me\s+to/i,
      /navigate\s+(me\s+)?to/i,
      /visit\s+(the\s+)?/i,
      /show\s+me\s+(the\s+)?/i,
      /bring\s+me\s+to/i,
      /launch\s+(the\s+)?/i,
      /load\s+(the\s+)?/i,
      /redirect\s+(me\s+)?to/i,
      /\bpage\b/i,
    ],
  },
  {
    intent:   "FOLLOW_UP",
    weight:   11,
    patterns: [
      /^(yes|yeah|yep|sure|please|ok|okay|go ahead|do it|absolutely|definitely|sounds good|that works)\b/i,
      /tell me more/i,
      /more (info|information|details|about that)/i,
      /^(explain|elaborate|clarify|expand)\b/i,
      /what do you mean/i,
      /can you (explain|elaborate|clarify|expand)/i,
      /^(why|how so|how come)\??\s*$/i,
      /^(thanks|thank you|dank je|bedankt|got it|understood|i see|makes sense|perfect|great|awesome)\b/i,
      /what (else|about|next)/i,
      /and (what|how|why)/i,
      /go on/i,
      /continue/i,
      /anything else/i,
    ],
  },
  {
    intent:   "CONVERSATION",
    weight:   7,
    patterns: [
      /what do you think/i,
      /can (we|you) (talk|discuss|chat)/i,
      /i (have|need|got) (a )?question/i,
      /help me (understand|decide|choose|figure)/i,
      /(compare|difference between|pros and cons)/i,
      /should i/i,
      /advice on/i,
      /what would you (recommend|suggest)/i,
      /i('m| am) (confused|unsure|not sure)/i,
      /can you help me with/i,
      /i want to (know|learn|understand)/i,
      /tell me about/i,
      /discuss/i,
    ],
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
      // Dutch patterns
      /zoek\s+(een\s+)?taak/i,
      /toon\s+taken/i,
      /beschikbare\s+taken/i,
      /taken\s+(voor|over|in)/i,
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
      // Dutch patterns
      /hoeveel\s+(verdien|kost|betaal)/i,
      /wat\s+is\s+een\s+eerlijk\s+(tarief|budget)/i,
      /marktprijs/i,
    ],
  },
  {
    intent:   "ESCROW_HELP",
    weight:   9,
    patterns: [
      /escrow/i,
      /how.*pay(ment)?\s*work/i,
      /when.*get\s+paid/i,
      /payment\s+(safe|protected|guarantee)/i,
      /stripe\s+connect/i,
      /milestone.*pay/i,
      /release.*fund/i,
      /fund.*lock/i,
      // Dutch patterns
      /wanneer\s+word\s+ik\s+betaald/i,
      /betaling\s+(veilig|garantie)/i,
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
      // Dutch patterns
      /overeenkomst/i,
      /juridisch/i,
      /ondertekenen/i,
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
      // Dutch patterns
      /hoe\s+solliciteer/i,
      /aanmelding\s+versturen/i,
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
      // Dutch patterns
      /taak\s+plaatsen/i,
      /student\s+inhuren/i,
      /opdracht\s+aanmaken/i,
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
      // Dutch patterns
      /profiel\s+verbeteren/i,
      /geselecteerd\s+worden/i,
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
      // Dutch patterns
      /hoeveel\s+(studenten|taken|bedrijven)/i,
      /platform\s+statistieken/i,
    ],
  },
  {
    intent:   "PROPOSAL_HELP",
    weight:   10,
    patterns: [
      /write\s+(me\s+)?(a\s+)?(cover\s+letter|proposal|pitch)/i,
      /draft\s+(a\s+)?(proposal|cover\s+letter|application)/i,
      /help\s+(me\s+)?(write|draft)\s+(a\s+)?(proposal|application)/i,
      /cover\s+letter\s+for/i,
      /proposal\s+for\s+(task|this)/i,
      /apply\s+to\s+this\s+task/i,
      /how\s+do\s+i\s+write\s+a\s+proposal/i,
      // Dutch patterns
      /motivatiebrief\s+schrijven/i,
      /sollicitatiebrief\s+opstellen/i,
    ],
  },
  {
    intent:   "DASHBOARD_REQUEST",
    weight:   8,
    patterns: [
      /my\s+(dashboard|overview|summary|status)/i,
      /show\s+my\s+(tasks|applications|profile)/i,
      /what\s+(am\s+i|have\s+i)\s+(working\s+on|applied)/i,
      /my\s+(current|active)\s+tasks?/i,
      /how\s+am\s+i\s+doing/i,
      /my\s+stats/i,
      // Dutch patterns
      /mijn\s+(dashboard|overzicht|taken|sollicitaties)/i,
    ],
  },
  {
    intent:   "PLATFORM_FAQ",
    weight:   12,
    patterns: [
      /how\s+does.*work/i,
      /what\s+is\s+(task\s*bridge|this\s+app|the\s+app|this\s+platform|the\s+platform)/i,
      /what\s+(is|does)\s+(this|the)\s+app\s+(for|do|about)?/i,
      /what\s+can\s+(i|you)\s+do/i,
      /why\s+(this|the)\s+app/i,
      /tell\s+me\s+w[ahy]*\s+(this|the)?\s*app/i,
      /tell\s+me\s+about\s+(this\s+app|the\s+app|taskbridge|the\s+platform)/i,
      /introduce\s+(the\s+)?(app|platform|taskbridge|service)/i,
      /purpose\s+of\s+(this\s+)?(app|platform|taskbridge)/i,
      /about\s+(this\s+)?(app|platform|taskbridge)/i,
      /explain\s+(the\s+)?(app|platform|taskbridge)/i,
      /get\s+started/i,
      /how\s+to\s+start/i,
      /what.*commission/i,
      /fee/i,
      // Dutch patterns
      /hoe\s+werkt/i,
      /wat\s+is\s+taskbridge/i,
      /vertel\s+me\s+over/i,
      /waar\s+is\s+deze\s+app\s+voor/i,
    ],
  },
];

export interface ExtractedEntities {
  skills:     string[];
  category:   string | null;
  budgetHint: string | null;  // e.g. "€500" or "500 euro"
  taskId:     string | null;  // UUID if detected
  language:   "nl" | "en";   // detected language
}

export interface ClassificationResult {
  intent:     Intent;
  confidence: number; // 0–1
  matched:    string; // which pattern matched
  entities:   ExtractedEntities;
}

// ── Dutch language signal words ────────────────────────────────────────────────

const DUTCH_SIGNALS = [
  "hoe", "wat", "wanneer", "hoeveel", "ik", "mijn", "taak", "taken",
  "studenten", "bedrijf", "opdracht", "betaling", "sollicitatie",
  "goedemorgen", "goedemiddag", "dag", "hoi", "jij", "jouw",
];

function detectLanguage(message: string): "nl" | "en" {
  const lower = message.toLowerCase();
  const dutchHits = DUTCH_SIGNALS.filter((w) => lower.includes(w)).length;
  return dutchHits >= 2 ? "nl" : "en";
}

// ── Skill extraction ───────────────────────────────────────────────────────────

const KNOWN_SKILLS = [
  "react", "typescript", "javascript", "python", "node.js", "nodejs", "java",
  "figma", "ux", "ui", "design", "photoshop", "illustrator", "indesign",
  "excel", "sql", "tableau", "power bi", "r", "spss",
  "seo", "google ads", "facebook ads", "marketing", "copywriting",
  "research", "writing", "translation", "dutch", "english",
  "finance", "accounting", "legal", "gdpr", "compliance",
  "vue", "angular", "next.js", "nextjs", "laravel", "php", "django",
  "machine learning", "ai", "data science", "nlp", "deep learning",
  "wordpress", "webflow", "shopify", "woocommerce",
  "video editing", "premiere", "after effects", "animation",
];

function extractSkills(message: string): string[] {
  const lower = message.toLowerCase();
  return KNOWN_SKILLS.filter((skill) => lower.includes(skill));
}

// ── Budget hint extraction ─────────────────────────────────────────────────────

function extractBudgetHint(message: string): string | null {
  const match = message.match(/€\s*[\d,]+|[\d,]+\s*euro|[\d,]+\s*€/i);
  return match ? match[0].trim() : null;
}

// ── Task UUID extraction ───────────────────────────────────────────────────────

function extractTaskId(message: string): string | null {
  const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
  const match = message.match(uuidPattern);
  return match ? match[0] : null;
}

// ── Main classifier ────────────────────────────────────────────────────────────

export function classifyIntent(message: string): ClassificationResult {
  const entities: ExtractedEntities = {
    skills:     extractSkills(message),
    category:   extractCategory(message),
    budgetHint: extractBudgetHint(message),
    taskId:     extractTaskId(message),
    language:   detectLanguage(message),
  };

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
    return { intent: "UNKNOWN", confidence: 0, matched: "", entities };
  }

  // Pick highest weight match; if tie, prefer later (more specific) rule
  const best = matches.sort((a, b) => b.weight - a.weight)[0]!;
  const confidence = Math.min(0.95, best.weight / 10);

  return { intent: best.intent, confidence, matched: best.pattern, entities };
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
    // Dutch
    .replace(/zoek\s+(een\s+)?taak/i, "")
    .replace(/toon\s+taken/i, "")
    .trim() || message;
}

// ── Extract budget category from a BUDGET_ADVICE message ──────────────────────

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  RESEARCH:      ["research", "analysis", "study", "survey", "report", "academic", "onderzoek", "studie"],
  DESIGN:        ["design", "figma", "ui", "ux", "branding", "logo", "visual", "ontwerp", "visueel"],
  DATA_ANALYSIS: ["data", "excel", "analytics", "statistics", "python", "sql", "dataset", "statistiek"],
  MARKETING:     ["marketing", "social media", "seo", "content", "campaign", "ads", "advertentie"],
  DEVELOPMENT:   ["code", "programming", "develop", "software", "app", "website", "api", "programmeren"],
  WRITING:       ["write", "writing", "copy", "blog", "article", "content", "schrijven", "tekst"],
  FINANCE:       ["finance", "financial", "accounting", "budget", "investment", "financieel", "boekhouding"],
  LEGAL:         ["legal", "contract", "compliance", "gdpr", "law", "juridisch", "recht"],
};

export function extractCategory(message: string): string | null {
  const lower = message.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return category;
  }
  return null;
}
