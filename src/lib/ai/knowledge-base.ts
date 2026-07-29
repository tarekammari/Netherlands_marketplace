/**
 * src/lib/ai/knowledge-base.ts
 *
 * Static platform knowledge base for TBAI.
 * Contains curated factual answers about TaskBridge NL.
 * Used by the engine for PLATFORM_FAQ, ESCROW_HELP, CONTRACT_HELP intents.
 */

export interface KBEntry {
  id:       string;
  question: string; // representative question for matching
  answer:   string; // templated answer (may use {variables})
  intent:   string;
}

export const KNOWLEDGE_BASE: KBEntry[] = [
  // ── Platform Overview ───────────────────────────────────────────────────────
  {
    id:       "what_is_taskbridge",
    intent:   "PLATFORM_FAQ",
    question: "What is TaskBridge NL?",
    answer:   "**TaskBridge NL** is the Netherlands' leading marketplace connecting university students with companies for short-term professional tasks.\n\n✅ Students earn real income doing portfolio work\n✅ Enterprises get vetted talent without hiring overhead\n✅ Every payment is protected by Stripe escrow",
  },
  {
    id:       "commission",
    intent:   "PLATFORM_FAQ",
    question: "What are the fees?",
    answer:   "TaskBridge charges a **10% platform commission** — deducted from the enterprise payment before it reaches the student.\n\n- Student receives: **90%** of the agreed budget\n- Platform fee: **10%** (covers escrow, contracts, support)\n- No subscription fees. No hidden costs.",
  },
  {
    id:       "get_started_student",
    intent:   "PLATFORM_FAQ",
    question: "How do I get started as a student?",
    answer:   "Getting started as a student is quick:\n\n1. **Register** at /register?role=student with your university email\n2. **Complete your profile** — add skills, study field, and a short bio\n3. **Connect Stripe** — set up your payout account (takes 5 minutes)\n4. **Browse tasks** at /tasks and apply to matches\n5. **Win your first task** and start earning! 🎓",
  },
  {
    id:       "get_started_enterprise",
    intent:   "PLATFORM_FAQ",
    question: "How do I get started as an enterprise?",
    answer:   "Posting your first task is simple:\n\n1. **Register** at /register?role=enterprise with your company email\n2. **KVK verification** — enter your Chamber of Commerce number\n3. **Post a task** — describe the project, set milestones, and your budget\n4. **Review applications** — browse student profiles and cover letters\n5. **Select a student** — contract auto-generates, escrow locks in 🔒",
  },

  // ── Escrow & Payments ───────────────────────────────────────────────────────
  {
    id:       "how_escrow_works",
    intent:   "ESCROW_HELP",
    question: "How does the escrow payment work?",
    answer:   "Here's how **Stripe Escrow** protects every transaction:\n\n1. 🔒 Enterprise locks budget in Stripe escrow when selecting a student\n2. 📄 Legal contract auto-generates and is sent to both parties\n3. ✅ Student completes each milestone and submits deliverables\n4. 👍 Enterprise approves the milestone\n5. 💸 Stripe instantly transfers **90%** to the student's bank account\n\nThe enterprise **cannot** cancel payment after work is approved. Students are **fully protected**.",
  },
  {
    id:       "when_paid",
    intent:   "ESCROW_HELP",
    question: "When do I get paid?",
    answer:   "Payments are released **immediately** when an enterprise approves your milestone submission.\n\nThe transfer goes directly to your connected Stripe bank account. Depending on your bank, funds appear within **1–3 business days**.\n\n⚠️ If an enterprise doesn't respond within **7 days** of a milestone submission, funds are **auto-released** to you.",
  },
  {
    id:       "payment_safe",
    intent:   "ESCROW_HELP",
    question: "Is my payment safe?",
    answer:   "Absolutely. TaskBridge uses **Stripe Connect Express** — the same infrastructure used by platforms like Airbnb and Lyft.\n\n✅ Funds are locked before work begins\n✅ Enterprise cannot access escrow funds once locked\n✅ Auto-release after 7 days if enterprise is unresponsive\n✅ Dispute mediation team if issues arise",
  },

  // ── Contracts ───────────────────────────────────────────────────────────────
  {
    id:       "contract_auto",
    intent:   "CONTRACT_HELP",
    question: "How are contracts generated?",
    answer:   "When an enterprise selects a student, TaskBridge **automatically generates** a legally-binding PDF assignment agreement under Dutch law.\n\n📄 The contract includes:\n- Task description and deliverables\n- Budget and milestone breakdown\n- Both parties' verified identities\n- IP ownership clauses\n- Dutch tax handling guidance\n\nBoth parties receive the document for digital signature. No lawyers needed.",
  },
  {
    id:       "contract_legal",
    intent:   "CONTRACT_HELP",
    question: "Are the contracts legally valid?",
    answer:   "Yes. TaskBridge contracts are drafted in compliance with **Dutch labor and assignment law**.\n\nThey are recognized as valid civil agreements between an enterprise and a self-employed student. Students are treated as **freelancers (ZZP)**, not employees — which means simpler tax handling for both sides.",
  },

  // ── Applications ─────────────────────────────────────────────────────────────
  {
    id:       "how_apply",
    intent:   "APPLY_HELP",
    question: "How do I apply for a task?",
    answer:   "Applying is straightforward:\n\n1. Go to **/tasks** and browse open listings\n2. Click on a task that interests you\n3. Click **\"Apply\"** and write a cover letter (300–500 words is ideal)\n4. You can also propose a different budget if yours differs\n5. Add portfolio links to strengthen your application\n\n💡 **Tip:** Enterprises see your university, study field, and skills from your profile — make sure they're complete!",
  },
  {
    id:       "profile_tips",
    intent:   "PROFILE_ADVICE",
    question: "How do I improve my student profile?",
    answer:   "Profiles with these elements get **3× more selections**:\n\n✅ **Complete bio** — explain your academic focus and goals\n✅ **Skills list** — be specific (e.g., \"Python\", \"Figma\", \"SEO\" vs \"IT\")\n✅ **Portfolio URL** — GitHub, Behance, LinkedIn, personal site\n✅ **Stripe payout setup** — enterprises prefer students ready to receive payment\n✅ **University verified** — use your institutional email (@tue.nl, @uva.nl, etc.)\n\n🏆 Students with 4+ reviews receive tasks **60% faster**.",
  },

  // ── Post Task ────────────────────────────────────────────────────────────────
  {
    id:       "how_post_task",
    intent:   "POST_TASK_HELP",
    question: "How do I post a task as a company?",
    answer:   "Creating a compelling task listing takes 5 minutes:\n\n1. Go to **/enterprise/tasks/new**\n2. Choose a **category** (Research, Design, Development, etc.)\n3. Write a clear **title and description** — be specific about deliverables\n4. Set a **budget** (check the Budget Advisor for market rates)\n5. Add **milestone breakdown** — split the work into 2–4 phases\n6. Set a **deadline**\n7. Publish and receive applications typically **within 24 hours** 🚀",
  },

  // ── Greeting ─────────────────────────────────────────────────────────────────
  {
    id:       "greeting",
    intent:   "GREETING",
    question: "Hello",
    answer:   "👋 Hi! I'm **TBAI** — the TaskBridge AI assistant, built specifically for this platform.\n\nI can help you:\n- 🔍 **Find tasks** matching your skills\n- 💰 **Get budget advice** for your project type\n- 📄 **Understand contracts** and escrow payments\n- 🎓 **Tips to stand out** as a student applicant\n\nWhat can I help you with?",
  },
];

export function getAnswerByIntent(intent: string): KBEntry | undefined {
  // Return the first entry matching the intent
  return KNOWLEDGE_BASE.find((e) => e.intent === intent);
}

export function getAllByIntent(intent: string): KBEntry[] {
  return KNOWLEDGE_BASE.filter((e) => e.intent === intent);
}
