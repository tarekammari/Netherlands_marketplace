/**
 * src/app/admin/ai/page.tsx
 *
 * Admin — TBAI Intelligence Dashboard
 * Real-time AI analytics: intent distribution, confidence trends,
 * session volume, Full AI Mode adoption, and learning curve.
 * Protected: ADMIN role only.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Brain, Sparkles, TrendingUp, MessageSquare,
  RefreshCw, Zap, AlertCircle, BarChart2,
  Users, Target, Activity,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface IntentBucket {
  intent: string;
  count:  number;
}

interface UsageStats {
  totalSessions:       number;
  totalMessages:       number;
  recentMessages:      number;
  fullAIModeUsage:     number;
  fullAIModePercentage: number;
  intentDistribution:  IntentBucket[];
  avgConfidenceScore:  number;
  dailyEventVolume:    number;
  fallbackRate:        number;
}

interface Recommendation {
  text: string;
}

interface AdminReport {
  generatedAt:  string;
  healthScore:  number;
  summaryText:  string;
  metrics: {
    totalUsers:                 number;
    studentCount:               number;
    enterpriseCount:            number;
    totalTasks:                 number;
    openTasks:                  number;
    completedTasks:             number;
    escrowVolumeFormatted:      string;
    platformFeeRevenueFormatted: string;
  };
  recommendations: Recommendation[] | string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const INTENT_COLORS: Record<string, string> = {
  TASK_SEARCH:      "#f97316",
  BUDGET_ADVICE:    "#10b981",
  PLATFORM_FAQ:     "#6366f1",
  ESCROW_HELP:      "#3b82f6",
  CONTRACT_HELP:    "#8b5cf6",
  APPLY_HELP:       "#ec4899",
  POST_TASK_HELP:   "#14b8a6",
  PROFILE_ADVICE:   "#f59e0b",
  STATS_REQUEST:    "#06b6d4",
  PROPOSAL_HELP:    "#a855f7",
  DASHBOARD_REQUEST: "#84cc16",
  GREETING:         "#94a3b8",
  UNKNOWN:          "#e2e8f0",
};

function IntentBar({ bucket, maxCount }: { bucket: IntentBucket; maxCount: number }) {
  const pct = maxCount > 0 ? Math.round((bucket.count / maxCount) * 100) : 0;
  const color = INTENT_COLORS[bucket.intent] ?? "#94a3b8";
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 11, fontWeight: 700 }}>
        <span style={{ color: "#374151", fontFamily: "monospace", fontSize: 10 }}>
          {bucket.intent.replace(/_/g, " ")}
        </span>
        <span style={{ color: "#6b7280" }}>{bucket.count}</span>
      </div>
      <div style={{ height: 8, background: "#f3f4f6", borderRadius: 4, overflow: "hidden" }}>
        <div
          style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4, transition: "width 0.6s ease" }}
        />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, accent }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div style={{
      background: "white", borderRadius: 16, padding: "20px 22px",
      border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, background: accent ?? "#fff7ed",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {icon}
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "monospace" }}>
          {label}
        </span>
      </div>
      <p style={{ fontSize: 28, fontWeight: 900, color: "#111827", margin: 0, lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 4, fontWeight: 600 }}>{sub}</p>}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function AdminAIPage() {
  const [data,       setData]       = useState<{ report: AdminReport | null; usageStats: UsageStats | null } | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch("/api/ai/admin-report", { cache: "no-store" });
      if (res.status === 401) { setError("Access denied. Admin role required."); return; }
      if (!res.ok)            { setError("Failed to load AI analytics."); return; }
      const json = await res.json();
      setData(json);
      setLastFetched(new Date());
    } catch {
      setError("Network error loading AI analytics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const report     = data?.report;
  const stats      = data?.usageStats;
  const maxCount   = stats?.intentDistribution
    ? Math.max(...stats.intentDistribution.map((b) => b.count), 1)
    : 1;

  return (
    <div style={{ minHeight: "100vh", background: "#fafafb", padding: "40px 0", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>

        {/* Header */}
        <div style={{ marginBottom: 32, borderBottom: "1px solid #e5e7eb", paddingBottom: 24 }}>
          <div style={{ fontSize: 11, fontFamily: "monospace", letterSpacing: "0.25em", textTransform: "uppercase", color: "#f97316", fontWeight: 700, marginBottom: 4 }}>
            TBAI v2 · AI INTELLIGENCE CENTER
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <h1 style={{ fontSize: 30, fontWeight: 900, color: "#111827", textTransform: "uppercase", letterSpacing: "-0.5px", margin: 0 }}>
              AI Analytics Dashboard
            </h1>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <Link
                href="/admin"
                style={{ padding: "8px 16px", fontSize: 11, fontFamily: "monospace", fontWeight: 700, border: "1px solid #e5e7eb", borderRadius: 10, color: "#374151", textDecoration: "none", background: "white" }}
              >
                ← Back to Admin
              </Link>
              <button
                onClick={fetchData}
                disabled={loading}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "8px 16px",
                  fontSize: 11, fontFamily: "monospace", fontWeight: 700,
                  border: "1px solid #fed7aa", borderRadius: 10, color: "#9a3412",
                  background: "#fff7ed", cursor: "pointer", opacity: loading ? 0.6 : 1,
                }}
              >
                <RefreshCw size={12} style={loading ? { animation: "spin 1s linear infinite" } : undefined} />
                Refresh
              </button>
              {lastFetched && (
                <span style={{ fontSize: 10, color: "#9ca3af", fontFamily: "monospace" }}>
                  Updated {lastFetched.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: 20, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 14, marginBottom: 24, display: "flex", gap: 10, alignItems: "center" }}>
            <AlertCircle size={18} color="#dc2626" />
            <span style={{ fontSize: 13, color: "#991b1b", fontWeight: 600 }}>{error}</span>
          </div>
        )}

        {/* Loading shimmer */}
        {loading && !data && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ height: 110, background: "linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)", borderRadius: 16, animation: "shimmer 1.5s infinite" }} />
            ))}
            <style>{`@keyframes shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }`}</style>
          </div>
        )}

        {data && (
          <>
            {/* Platform Health */}
            {report && (
              <div style={{
                background: "linear-gradient(135deg, #1e1b4b, #0f172a)",
                borderRadius: 20, padding: "24px 28px", marginBottom: 28, color: "white",
                display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap",
              }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 18,
                  background: `conic-gradient(#f97316 ${report.healthScore * 3.6}deg, rgba(255,255,255,0.1) 0deg)`,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  boxShadow: "0 0 20px rgba(249,115,22,0.4)",
                }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: "#1e1b4b", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 16, fontWeight: 900, color: "#f97316" }}>{report.healthScore}%</span>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: "0.2em", color: "#94a3b8", textTransform: "uppercase", marginBottom: 4 }}>
                    PLATFORM HEALTH · {report.generatedAt}
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0", margin: 0, lineHeight: 1.5 }}>
                    {report.summaryText}
                  </p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px" }}>
                  {[
                    { label: "Open Tasks",      value: report.metrics.openTasks },
                    { label: "Students",         value: report.metrics.studentCount },
                    { label: "Enterprises",      value: report.metrics.enterpriseCount },
                    { label: "Escrow Volume",    value: report.metrics.escrowVolumeFormatted },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div style={{ fontSize: 9, color: "#64748b", fontFamily: "monospace", textTransform: "uppercase" }}>{label}</div>
                      <div style={{ fontSize: 14, fontWeight: 900, color: "white" }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Usage Stats Cards */}
            {stats && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 16, marginBottom: 28 }}>
                <StatCard
                  icon={<MessageSquare size={18} color="#f97316" />}
                  label="Total Chat Sessions"
                  value={stats.totalSessions.toLocaleString()}
                  sub="All time"
                  accent="#fff7ed"
                />
                <StatCard
                  icon={<Activity size={18} color="#10b981" />}
                  label="AI Responses (7d)"
                  value={stats.recentMessages.toLocaleString()}
                  sub="Last 7 days"
                  accent="#ecfdf5"
                />
                <StatCard
                  icon={<Brain size={18} color="#6366f1" />}
                  label="Full AI Mode"
                  value={`${stats.fullAIModePercentage}%`}
                  sub={`${stats.fullAIModeUsage} messages (7d)`}
                  accent="#eef2ff"
                />
                <StatCard
                  icon={<Target size={18} color="#3b82f6" />}
                  label="Avg Confidence"
                  value={`${stats.avgConfidenceScore}%`}
                  sub="Intent accuracy score"
                  accent="#eff6ff"
                />
                <StatCard
                  icon={<TrendingUp size={18} color="#8b5cf6" />}
                  label="Total Responses"
                  value={stats.totalMessages.toLocaleString()}
                  sub="All time"
                  accent="#f5f3ff"
                />
                <StatCard
                  icon={<Users size={18} color="#f59e0b" />}
                  label="Fallback Rate"
                  value={`${stats.fallbackRate}%`}
                  sub={stats.fallbackRate < 15 ? "✅ Low — engine healthy" : "⚠️ High — check intents"}
                  accent="#fffbeb"
                />
              </div>
            )}

            {/* Two-column: Intent Distribution + Recommendations */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>

              {/* Intent Distribution */}
              {stats && stats.intentDistribution.length > 0 && (
                <div style={{ background: "white", borderRadius: 18, border: "1px solid #e5e7eb", overflow: "hidden" }}>
                  <div style={{ padding: "18px 22px", borderBottom: "1px solid #f3f4f6", background: "#fafafa", display: "flex", alignItems: "center", gap: 8 }}>
                    <BarChart2 size={16} color="#6366f1" />
                    <h3 style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 800, textTransform: "uppercase", color: "#111827", margin: 0, letterSpacing: "0.08em" }}>
                      Intent Distribution (7 days)
                    </h3>
                  </div>
                  <div style={{ padding: "18px 22px" }}>
                    {stats.intentDistribution.slice(0, 10).map((bucket) => (
                      <IntentBar key={bucket.intent} bucket={bucket} maxCount={maxCount} />
                    ))}
                    {stats.intentDistribution.length === 0 && (
                      <p style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", padding: "20px 0" }}>
                        No chat data in the last 7 days.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* AI Recommendations */}
              {report && report.recommendations.length > 0 && (
                <div style={{ background: "white", borderRadius: 18, border: "1px solid #e5e7eb", overflow: "hidden" }}>
                  <div style={{ padding: "18px 22px", borderBottom: "1px solid #f3f4f6", background: "#fafafa", display: "flex", alignItems: "center", gap: 8 }}>
                    <Sparkles size={16} color="#f97316" />
                    <h3 style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 800, textTransform: "uppercase", color: "#111827", margin: 0, letterSpacing: "0.08em" }}>
                      AI Recommendations
                    </h3>
                  </div>
                  <div style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: 12 }}>
                    {report.recommendations.map((rec, i) => (
                      <div key={i} style={{
                        padding: "12px 14px", borderRadius: 12, background: "#fffbf7",
                        border: "1px solid #fed7aa", fontSize: 12, lineHeight: 1.55, color: "#374151",
                      }}>
                        {typeof rec === "string" ? rec : (rec as Recommendation).text}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* TBAI Engine Status */}
            <div style={{ background: "white", borderRadius: 18, border: "1px solid #e5e7eb", padding: "22px 26px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
                <Zap size={16} color="#f97316" />
                <h3 style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 800, textTransform: "uppercase", color: "#111827", margin: 0, letterSpacing: "0.08em" }}>
                  TBAI v2 Engine Status
                </h3>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                {[
                  { label: "Intent Classifier",    status: "✅ Active",  sub: "13 intent types + entity extraction" },
                  { label: "User Memory Module",    status: "✅ Active",  sub: "AIInsight-backed, 30-day decay" },
                  { label: "Full AI Mode",          status: "✅ Active",  sub: "Toggle per-session" },
                  { label: "TF-IDF Task Search",    status: "✅ Active",  sub: "Personalized vector ranking" },
                  { label: "Proposal Generator",    status: "✅ Active",  sub: "Cover letter scaffolding" },
                  { label: "Agent Executor",        status: "✅ Active",  sub: "10 action types + Dutch support" },
                  { label: "Behavioral Learner",    status: "✅ Active",  sub: `Runs every 20 events` },
                  { label: "Proactive Nudge Agent", status: "🕒 Planned", sub: "Phase 5 — not yet deployed" },
                ].map(({ label, status, sub }) => (
                  <div key={label} style={{ padding: "12px 14px", borderRadius: 12, border: "1px solid #f3f4f6", background: "#fafafa" }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#111827", marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: status.startsWith("✅") ? "#059669" : "#d97706" }}>{status}</div>
                    <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>{sub}</div>
                  </div>
                ))}
              </div>
            </div>

          </>
        )}

        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </div>
  );
}
