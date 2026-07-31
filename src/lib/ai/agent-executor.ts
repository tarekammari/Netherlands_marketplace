/**
 * src/lib/ai/agent-executor.ts
 *
 * TBAI v2 Autonomous Agent Action Dispatcher.
 * Structures and executes app tasks on behalf of users.
 * Supports rich action types and DB-context-aware resolution.
 */

export type AgentActionType =
  | "NAVIGATE"
  | "FILTER_CATEGORY"
  | "PREFILL_APPLICATION"
  | "SHOW_ANALYTICS"
  | "TOGGLE_AI_MODE"
  | "SHOW_REPORT"
  | "DRAFT_PROPOSAL"
  | "APPLY_NOW"
  | "VIEW_PROFILE"
  | "VIEW_DASHBOARD";

export interface AgentAction {
  type:        AgentActionType;
  label:       string;
  url?:        string | undefined;
  payload?:    Record<string, unknown> | undefined;
  autoExecute?: boolean | undefined;
  confidence?: number | undefined;
  icon?:       string | undefined;
}

export interface NavigationTarget {
  url:   string;
  label: string;
}

/** Known app pages the agent can open on behalf of the user. */
export const APP_PAGES: Array<{
  aliases: string[];
  url:     string;
  label:   string;
  roles?:  string[];
}> = [
  { aliases: ["about us", "about page", "over ons"],           url: "/about",                    label: "About Us" },
  { aliases: ["contact", "contact us", "contact page"],       url: "/contact",                  label: "Contact" },
  { aliases: ["pricing", "prices", "fees", "escrow pricing"], url: "/pricing",                  label: "Pricing" },
  { aliases: ["faq", "frequently asked", "help page"],         url: "/faq",                      label: "FAQ" },
  { aliases: ["tasks", "browse tasks", "task listings", "task board", "find tasks page"], url: "/tasks", label: "Tasks" },
  { aliases: ["home", "homepage", "main page", "landing"],    url: "/",                         label: "Home" },
  { aliases: ["login", "sign in", "log in"],                   url: "/login",                    label: "Login" },
  { aliases: ["register", "sign up", "signup", "join", "create account"], url: "/register",    label: "Register" },
  { aliases: ["settings", "account settings"],                url: "/settings",                 label: "Settings" },
  { aliases: ["post task", "new task", "create task"],         url: "/enterprise/tasks/new",     label: "Post a Task", roles: ["ENTERPRISE"] },
  { aliases: ["my applications", "applications page"],         url: "/student/applications",     label: "My Applications", roles: ["STUDENT"] },
  { aliases: ["student dashboard"],                            url: "/student/dashboard",        label: "Student Dashboard", roles: ["STUDENT"] },
  { aliases: ["enterprise dashboard", "my tasks dashboard"],  url: "/enterprise/dashboard",     label: "Enterprise Dashboard", roles: ["ENTERPRISE"] },
  { aliases: ["enterprise tasks", "manage tasks"],             url: "/enterprise/tasks",         label: "Enterprise Tasks", roles: ["ENTERPRISE"] },
  { aliases: ["student profile", "my profile page"],           url: "/student/profile",          label: "My Profile", roles: ["STUDENT"] },
  { aliases: ["enterprise profile"],                            url: "/enterprise/profile",       label: "Company Profile", roles: ["ENTERPRISE"] },
];

export class AgentExecutor {
  /**
   * Constructs a structured navigation action.
   */
  public static navigate(label: string, url: string, autoExecute = false, icon = "🔗"): AgentAction {
    return { type: "NAVIGATE", label, url, autoExecute, confidence: 0.9, icon };
  }

  /**
   * Constructs a category filter action.
   */
  public static filterCategory(category: string): AgentAction {
    return {
      type:        "FILTER_CATEGORY",
      label:       `Filter by ${category.replace(/_/g, " ")}`,
      url:         `/tasks?category=${encodeURIComponent(category)}`,
      payload:     { category },
      autoExecute: true,
      confidence:  0.85,
      icon:        "🔍",
    };
  }

  /**
   * Constructs an action to prefill a task application draft.
   */
  public static prefillApplication(taskId: string, coverLetterHint: string): AgentAction {
    return {
      type:        "PREFILL_APPLICATION",
      label:       "Draft Proposal with AI Assist",
      url:         `/tasks/${taskId}/apply`,
      payload:     { taskId, coverLetterHint },
      autoExecute: false,
      confidence:  0.88,
      icon:        "✍️",
    };
  }

  /**
   * Constructs an action to display Admin Intelligence Reports.
   */
  public static showReport(reportTitle: string): AgentAction {
    return {
      type:        "SHOW_REPORT",
      label:       `View ${reportTitle}`,
      payload:     { reportTitle },
      autoExecute: true,
      confidence:  0.92,
      icon:        "📊",
    };
  }

  /**
   * Constructs an action to draft a proposal for a specific task.
   */
  public static draftProposal(taskId: string, taskTitle: string): AgentAction {
    return {
      type:        "DRAFT_PROPOSAL",
      label:       `Write Proposal for "${taskTitle.slice(0, 30)}${taskTitle.length > 30 ? "…" : ""}"`,
      url:         `/tasks/${taskId}/apply`,
      payload:     { taskId, taskTitle },
      autoExecute: false,
      confidence:  0.9,
      icon:        "📝",
    };
  }

  /**
   * Constructs an action to apply directly to a task.
   */
  public static applyNow(taskId: string): AgentAction {
    return {
      type:        "APPLY_NOW",
      label:       "Apply to This Task",
      url:         `/tasks/${taskId}/apply`,
      payload:     { taskId },
      autoExecute: false,
      confidence:  0.85,
      icon:        "🚀",
    };
  }

  /**
   * Constructs an action to view a user's own profile.
   */
  public static viewProfile(role: string): AgentAction {
    const url = role === "ENTERPRISE" ? "/enterprise/profile" : "/student/profile";
    return {
      type:        "VIEW_PROFILE",
      label:       "View My Profile",
      url,
      autoExecute: false,
      confidence:  0.8,
      icon:        "👤",
    };
  }

  /**
   * Constructs an action to open the user's personal dashboard.
   */
  public static viewDashboard(role: string): AgentAction {
    const url = role === "ENTERPRISE" ? "/enterprise/tasks" : "/student/applications";
    const label = role === "ENTERPRISE" ? "Open My Task Dashboard" : "Open My Applications";
    return {
      type:        "VIEW_DASHBOARD",
      label,
      url,
      autoExecute: false,
      confidence:  0.88,
      icon:        "📋",
    };
  }

  /**
   * Resolves a natural-language navigation request to a known app page.
   */
  public static resolveNavigationTarget(query: string, userRole?: string): NavigationTarget | null {
    const lower = query.toLowerCase().replace(/['"]/g, "");

    const normalized = lower
      .replace(/\b(open|go to|take me to|navigate to|visit|show me|bring me to|launch|load|redirect me to|redirect to)\b/gi, " ")
      .replace(/\b(the|a|an|page|screen|section|tab|please|now|for me|up)\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

    const searchTexts = [normalized, lower];

    const pages = [...APP_PAGES].sort(
      (a, b) => Math.max(...b.aliases.map((x) => x.length)) - Math.max(...a.aliases.map((x) => x.length))
    );

    for (const page of pages) {
      if (page.roles && userRole && !page.roles.includes(userRole)) continue;

      const aliases = [...page.aliases].sort((a, b) => b.length - a.length);
      for (const alias of aliases) {
        for (const text of searchTexts) {
          if (text.includes(alias)) {
            return { url: page.url, label: page.label };
          }
        }
      }
    }

    return null;
  }

  /**
   * Determines if a user query implies an autonomous app action.
   * Enhanced with personalized resolution using role context.
   */
  public static resolveQueryAction(query: string, userRole?: string): AgentAction | null {
    const q = query.toLowerCase();

    const navTarget = AgentExecutor.resolveNavigationTarget(query, userRole);
    if (navTarget) {
      return AgentExecutor.navigate(`Open ${navTarget.label}`, navTarget.url, true, "🔗");
    }

    if (q.includes("post task") || q.includes("create task") || q.includes("commission") || q.includes("taak plaatsen")) {
      return AgentExecutor.navigate("Post a New Task Brief", "/enterprise/tasks/new", true, "📋");
    }

    if (q.includes("my applications") || q.includes("applied tasks") || q.includes("mijn sollicitaties")) {
      return AgentExecutor.navigate("Open My Applications", "/student/applications", true, "📄");
    }

    if (q.includes("my tasks") || q.includes("manage tasks") || q.includes("mijn taken")) {
      return AgentExecutor.navigate("Open Enterprise Task Dashboard", "/enterprise/tasks", true, "💼");
    }

    if (q.includes("pricing") || q.includes("escrow fee") || q.includes("commission fee")) {
      return AgentExecutor.navigate("View Escrow & Pricing Model", "/pricing", true, "💰");
    }

    if (q.includes("register") || q.includes("sign up") || q.includes("join") || q.includes("aanmelden")) {
      const targetRole = userRole === "ENTERPRISE" ? "enterprise" : "student";
      return AgentExecutor.navigate("Open Registration Page", `/register?role=${targetRole}`, true, "✨");
    }

    if (q.includes("admin report") || q.includes("system analytics") || q.includes("platform report") || q.includes("platform statistieken")) {
      return AgentExecutor.showReport("Admin Intelligence Report");
    }

    if (q.includes("my profile") || q.includes("mijn profiel")) {
      return AgentExecutor.viewProfile(userRole ?? "STUDENT");
    }

    if (q.includes("dashboard") || q.includes("my stats") || q.includes("mijn overzicht")) {
      return AgentExecutor.viewDashboard(userRole ?? "STUDENT");
    }

    return null;
  }
}
