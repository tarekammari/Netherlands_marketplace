/**
 * src/lib/ai/memory.ts
 *
 * TBAI v2 User Memory Module.
 * Stores and retrieves per-user preference signals in AIInsight table.
 * Supports memory decay (signals older than 30 days lose weight).
 *
 * Keys are namespaced as: "mem_{userId}_{signal}"
 * e.g. "mem_abc123_preferred_category" → "DESIGN"
 */

import { db, getPrismaModel } from "@/lib/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = db as any;

// ── Types ──────────────────────────────────────────────────────────────────────

export interface UserMemory {
  preferredCategories: string[];   // e.g. ["DESIGN", "DEVELOPMENT"]
  preferredSkills:     string[];   // e.g. ["figma", "react"]
  budgetRangeHint:     string | null; // e.g. "€500-€1500"
  interactionCount:    number;     // total chat turns with TBAI
  lastActiveAt:        string | null; // ISO string
  lastIntent:          string | null; // last classified intent
  lastCategory:        string | null; // last category mentioned
}

export interface MemorySignal {
  category?:   string | undefined;
  skills?:     string[] | undefined;
  intent?:     string | undefined;
  budgetHint?: string | undefined;
}

const DEFAULT_MEMORY: UserMemory = {
  preferredCategories: [],
  preferredSkills:     [],
  budgetRangeHint:     null,
  interactionCount:    0,
  lastActiveAt:        null,
  lastIntent:          null,
  lastCategory:        null,
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function memKey(userId: string, signal: string): string {
  return `mem_${userId}_${signal}`;
}

async function readKey(key: string): Promise<string | null> {
  try {
    const aiInsightModel = getPrismaModel("AIInsight");
    if (!aiInsightModel) return null;
    const insight = await aiInsightModel.findUnique({ where: { key } });
    if (!insight) return null;
    // Memory decay: if not updated in 30 days, treat as null
    const ageMs = Date.now() - new Date(insight.updatedAt).getTime();
    if (ageMs > 30 * 24 * 60 * 60 * 1000) return null;
    return insight.value;
  } catch {
    return null;
  }
}

async function writeKey(key: string, value: string, confidence = 0.7): Promise<void> {
  try {
    const aiInsightModel = getPrismaModel("AIInsight");
    if (!aiInsightModel) return;
    await aiInsightModel.upsert({
      where:  { key },
      create: { key, value, confidence, sampleSize: 1 },
      update: { value, confidence },
    });
  } catch {
    // Silent fail — memory is best-effort
  }
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Retrieves full user memory from AIInsight table.
 */
export async function getMemory(userId: string): Promise<UserMemory> {
  try {
    const [categories, skills, budget, count, lastActive, lastIntent, lastCategory] = await Promise.all([
      readKey(memKey(userId, "preferred_categories")),
      readKey(memKey(userId, "preferred_skills")),
      readKey(memKey(userId, "budget_range_hint")),
      readKey(memKey(userId, "interaction_count")),
      readKey(memKey(userId, "last_active_at")),
      readKey(memKey(userId, "last_intent")),
      readKey(memKey(userId, "last_category")),
    ]);

    return {
      preferredCategories: categories ? categories.split(",").filter(Boolean) : [],
      preferredSkills:     skills     ? skills.split(",").filter(Boolean)     : [],
      budgetRangeHint:     budget     ?? null,
      interactionCount:    count      ? parseInt(count, 10) : 0,
      lastActiveAt:        lastActive ?? null,
      lastIntent:          lastIntent ?? null,
      lastCategory:        lastCategory ?? null,
    };
  } catch {
    return { ...DEFAULT_MEMORY };
  }
}

/**
 * Updates user memory based on a new interaction signal.
 * Category and skill preferences are merged (not replaced) with existing memory.
 */
export async function updateMemory(userId: string, signal: MemorySignal): Promise<void> {
  try {
    const existing = await getMemory(userId);

    const writes: Promise<void>[] = [];

    // Merge category preferences
    if (signal.category) {
      const cats = new Set([...existing.preferredCategories, signal.category]);
      // Keep max 5 categories (oldest are dropped by Set insertion order)
      const trimmed = [...cats].slice(-5);
      writes.push(writeKey(memKey(userId, "preferred_categories"), trimmed.join(","), 0.8));
      writes.push(writeKey(memKey(userId, "last_category"), signal.category, 0.95));
    }

    // Merge skill preferences
    if (signal.skills && signal.skills.length > 0) {
      const skillSet = new Set([...existing.preferredSkills, ...signal.skills]);
      const trimmed = [...skillSet].slice(-10);
      writes.push(writeKey(memKey(userId, "preferred_skills"), trimmed.join(","), 0.8));
    }

    // Update budget hint if provided
    if (signal.budgetHint) {
      writes.push(writeKey(memKey(userId, "budget_range_hint"), signal.budgetHint, 0.7));
    }

    // Increment interaction count
    const newCount = existing.interactionCount + 1;
    writes.push(writeKey(memKey(userId, "interaction_count"), newCount.toString(), 0.99));

    // Update timestamps and last intent
    writes.push(writeKey(memKey(userId, "last_active_at"), new Date().toISOString(), 0.99));
    if (signal.intent) {
      writes.push(writeKey(memKey(userId, "last_intent"), signal.intent, 0.9));
    }

    await Promise.allSettled(writes);
  } catch {
    // Silent fail — memory is best-effort
  }
}

/**
 * Builds a personalization context string to enhance AI responses.
 */
export function buildPersonalizationHint(memory: UserMemory): string {
  const parts: string[] = [];

  if (memory.preferredCategories.length > 0) {
    const cats = memory.preferredCategories.map((c) => c.replace(/_/g, " ")).join(", ");
    parts.push(`_Preferred areas: **${cats}**_`);
  }

  if (memory.preferredSkills.length > 0) {
    parts.push(`_Known skills: **${memory.preferredSkills.slice(0, 5).join(", ")}**_`);
  }

  if (memory.interactionCount > 5) {
    parts.push(`_Welcome back! You've had ${memory.interactionCount} conversations with TBAI._`);
  }

  return parts.length > 0 ? "\n\n" + parts.join("\n") : "";
}
