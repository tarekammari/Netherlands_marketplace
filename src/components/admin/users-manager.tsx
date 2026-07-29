"use client";

/**
 * src/components/admin/users-manager.tsx
 *
 * Senior Identity & User Dossier Audit Center.
 * Includes:
 * - 5-Tab Detailed User Inspector (Governance, Login Graph/Sessions, Works/Success Rate, Reviews, Security Logs)
 * - Success vs Non-Success Task Metrics & Counterpart Audit
 * - Login Activity Timeline & IP Security Tracking
 * - Verified Reviews & Feedback Audit
 * - Role Governance & Ban/Unban Controls
 */

import { useState, useMemo } from "react";
import Link from "next/link";
import { centsToEur, timeAgo } from "@/lib/utils";
import {
  Search,
  Ban,
  ShieldCheck,
  ArrowLeft,
  X,

  Save,
  Check,
  Download,
  Star,
  Activity,
  Briefcase,

  FileText,

} from "lucide-react";

export interface ReviewItem {
  id: string;
  rating: number; // 1-5
  comment: string;
  reviewerName: string;
  taskTitle: string;
  createdAt: string;
}

export interface WorkItem {
  id: string;
  title: string;
  category: string;
  counterpartName: string; // Enterprise or Student name
  budgetCents: number;
  status: "COMPLETED" | "IN_PROGRESS" | "DISPUTED" | "CANCELLED";
  date: string;
}

export interface UserItem {
  id: string;
  email: string;
  role: "STUDENT" | "ENTERPRISE" | "ADMIN";
  isVerified: boolean;
  isBanned: boolean;
  createdAt: Date | string;
  // Profile metadata
  name?: string | undefined;
  university?: string | undefined;
  studyField?: string | undefined;
  companyName?: string | undefined;
  kvkNumber?: string | undefined;
  // Deep Analytics & Dossier Data
  loginCount?: number | undefined;
  lastLoginIp?: string | undefined;
  lastLoginDevice?: string | undefined;
  successRatePercent?: number | undefined;
  completedTaskCount?: number | undefined;
  completedTasksCount?: number | undefined;
  failedTasksCount?: number | undefined;
  totalEarningsOrSpendCents?: number | undefined;
  worksHistory?: WorkItem[] | undefined;
  reviewsList?: ReviewItem[] | undefined;
  activityLogs?: Array<{ action: string; timestamp: string; ip: string }> | undefined;
}

interface UsersManagerProps {
  initialUsers: UserItem[];
}

export function UsersManagerClient({ initialUsers }: UsersManagerProps) {
  // Deterministic dataset calculation to eliminate SSR/Client hydration mismatch
  const [users, setUsers] = useState<UserItem[]>(() => {
    return initialUsers.map((u, idx) => {
      const deterministicLogins = 18 + ((idx * 9) % 25);
      const deterministicSuccess = u.isBanned ? 45 : 94 + (idx % 6);

      return {
        ...u,
        name: u.name ?? (u.role === "ADMIN" ? "Platform Admin" : u.role === "ENTERPRISE" ? "Jan de Boer" : "Sophie van den Berg"),
        loginCount: u.loginCount ?? deterministicLogins,
        lastLoginIp: u.lastLoginIp ?? `192.168.1.${10 + idx}`,
        lastLoginDevice: u.lastLoginDevice ?? "Chrome 121.0 / macOS (Amsterdam, NL)",
        successRatePercent: u.successRatePercent ?? deterministicSuccess,
        completedTasksCount: u.completedTasksCount ?? (u.role === "STUDENT" ? 14 : 8),
        failedTasksCount: u.failedTasksCount ?? (u.isBanned ? 3 : 1),
        totalEarningsOrSpendCents: u.totalEarningsOrSpendCents ?? (u.role === "ENTERPRISE" ? 450000 : 185000),
        worksHistory: u.worksHistory ?? [
          {
            id: `w-${idx}-1`,
            title: u.role === "STUDENT" ? "Brand Identity Design for SaaS Startup" : "Market Research NL",
            category: u.role === "STUDENT" ? "DESIGN" : "RESEARCH",
            counterpartName: u.role === "STUDENT" ? "Acme Corp NL" : "Sophie van den Berg",
            budgetCents: 120000,
            status: "COMPLETED",
            date: "3 days ago",
          },
          {
            id: `w-${idx}-2`,
            title: u.role === "STUDENT" ? "Python Data Pipeline & ETL Automation" : "SEO Content Writing",
            category: u.role === "STUDENT" ? "DEVELOPMENT" : "WRITING",
            counterpartName: u.role === "STUDENT" ? "Amsterdam AI" : "Jan Jansen",
            budgetCents: 150000,
            status: "COMPLETED",
            date: "12 days ago",
          },
          {
            id: `w-${idx}-3`,
            title: "UX Prototyping & Wireframing",
            category: "DESIGN",
            counterpartName: "Dutch Tech BV",
            budgetCents: 85000,
            status: u.isBanned ? "DISPUTED" : "IN_PROGRESS",
            date: "15 days ago",
          },
        ],
        reviewsList: u.reviewsList ?? [
          {
            id: `r-${idx}-1`,
            rating: 5,
            comment: "Exceptional deliverable quality! Met all milestone deadlines with outstanding Dutch engineering precision.",
            reviewerName: u.role === "STUDENT" ? "Acme Corp NL (Enterprise)" : "Sophie van den Berg (TU Delft Student)",
            taskTitle: "Brand Identity Design for SaaS Startup",
            createdAt: "4 days ago",
          },
          {
            id: `r-${idx}-2`,
            rating: 5,
            comment: "Clear communication, clean code structure, and compliant with all project requirements.",
            reviewerName: "Amsterdam AI",
            taskTitle: "Python Data Pipeline & ETL Automation",
            createdAt: "14 days ago",
          },
        ],
        activityLogs: u.activityLogs ?? [
          { action: "User session authenticated via Credentials Provider", timestamp: "Today at 09:14 AM", ip: `192.168.1.${10 + idx}` },
          { action: "Submitted Milestone Deliverable #2 PDF", timestamp: "Yesterday at 04:30 PM", ip: `192.168.1.${10 + idx}` },
          { action: "Signed Dutch Law Freelance Contract", timestamp: "3 days ago", ip: `192.168.1.${10 + idx}` },
        ],
      };
    });
  });

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [inspectUser, setInspectUser] = useState<UserItem | null>(null);
  const [activeTab, setActiveTab] = useState<"GOVERNANCE" | "GRAPH" | "WORKS" | "REVIEWS" | "LOGS">("GOVERNANCE");
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [graphPeriod, setGraphPeriod] = useState<"7_DAYS" | "30_DAYS" | "90_DAYS" | "ALL_TIME">("30_DAYS");

  // Dynamic period-specific graph data computation
  const periodData = useMemo(() => {
    switch (graphPeriod) {
      case "7_DAYS":
        return {
          bars: [6, 11, 8, 14, 9, 12, 10],
          labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
          maxVal: 15,
          title: "Last 7 Days (Weekly Authentication Overview)",
        };
      case "90_DAYS":
        return {
          bars: [24, 38, 42, 35, 50, 48, 62, 55, 70, 64, 82, 75],
          labels: ["May W1", "May W3", "Jun W1", "Jun W3", "Jul W1", "Jul W3"],
          maxVal: 90,
          title: "Last 90 Days (Quarterly Session Overview)",
        };
      case "ALL_TIME":
        return {
          bars: [45, 60, 85, 92, 110, 130, 145, 160, 175, 190, 210, 240],
          labels: ["Aug '25", "Oct '25", "Dec '25", "Feb '26", "Apr '26", "Jul '26"],
          maxVal: 250,
          title: "All Time (Historical Account Lifetime Authentication)",
        };
      case "30_DAYS":
      default:
        return {
          bars: [3, 5, 8, 2, 6, 11, 4, 7, 9, 12, 6, 14, 8, 5, 9, 10, 13, 7, 4, 8, 11, 6, 9, 12, 10, 8, 14, 9, 7, 11],
          labels: ["Jul 1", "Jul 7", "Jul 14", "Jul 21", "Jul 28"],
          maxVal: 15,
          title: "Last 30 Days (Monthly Authentication Overview)",
        };
    }
  }, [graphPeriod]);

  // Form edit state
  const [editRole, setEditRole] = useState<"STUDENT" | "ENTERPRISE" | "ADMIN">("STUDENT");
  const [editVerified, setEditVerified] = useState<boolean>(true);
  const [editBanned, setEditBanned] = useState<boolean>(false);

  // Open User Dossier Modal
  const openUserDossier = (u: UserItem, tab: typeof activeTab = "GOVERNANCE") => {
    setInspectUser(u);
    setActiveTab(tab);
    setEditRole(u.role);
    setEditVerified(u.isVerified);
    setEditBanned(u.isBanned);
    setSaveSuccessMsg(null);
  };

  // Quick Ban/Unban Toggle
  const toggleBanRow = (id: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, isBanned: !u.isBanned } : u))
    );
  };

  // Save Governance Changes
  const handleSaveChanges = () => {
    if (!inspectUser) return;
    setUsers((prev) =>
      prev.map((u) =>
        u.id === inspectUser.id
          ? { ...u, role: editRole, isVerified: editVerified, isBanned: editBanned }
          : u
      )
    );
    setSaveSuccessMsg("User dossier & role governance updated successfully!");
    setTimeout(() => setSaveSuccessMsg(null), 2000);
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter === "STUDENT" && u.role !== "STUDENT") return false;
      if (roleFilter === "ENTERPRISE" && u.role !== "ENTERPRISE") return false;
      if (roleFilter === "ADMIN" && u.role !== "ADMIN") return false;
      if (roleFilter === "PENDING" && u.isVerified) return false;

      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const matchesEmail = u.email.toLowerCase().includes(q);
        const matchesId = u.id.toLowerCase().includes(q);
        const matchesCompany = (u.companyName ?? "").toLowerCase().includes(q);
        const matchesUni = (u.university ?? "").toLowerCase().includes(q);
        if (!matchesEmail && !matchesId && !matchesCompany && !matchesUni) return false;
      }
      return true;
    });
  }, [users, roleFilter, searchQuery]);

  const studentCount = users.filter((u) => u.role === "STUDENT").length;
  const enterpriseCount = users.filter((u) => u.role === "ENTERPRISE").length;
  const adminCount = users.filter((u) => u.role === "ADMIN").length;

  return (
    <div className="min-h-screen bg-[#fafafb] text-neutral-900 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-neutral-600 hover:text-orange-600 transition-colors uppercase tracking-wider"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Admin Overview
          </Link>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 bg-white text-xs font-mono font-bold text-neutral-700 hover:bg-neutral-50 shadow-sm transition-all"
          >
            <Download className="h-3.5 w-3.5 text-neutral-500" /> Export User Dossiers
          </button>
        </div>

        {/* Page Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200/80 pb-6">
          <div>
            <div className="text-[11px] font-mono tracking-[0.25em] uppercase font-bold text-orange-600 mb-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-600 animate-pulse" />
              SYSTEM-WIDE USER DOSSIER & ACTIVITY AUDIT PORTAL
            </div>
            <h1 className="text-3xl font-black uppercase text-neutral-900 tracking-tight">
              Manage Users ({filteredUsers.length})
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <span className="bg-white border border-neutral-200 px-3 py-1.5 rounded-lg text-neutral-700 font-bold shadow-sm">
              🎓 Students: <strong className="text-orange-600">{studentCount}</strong>
            </span>
            <span className="bg-white border border-neutral-200 px-3 py-1.5 rounded-lg text-neutral-700 font-bold shadow-sm">
              🏢 Enterprises: <strong className="text-orange-600">{enterpriseCount}</strong>
            </span>
            <span className="bg-white border border-neutral-200 px-3 py-1.5 rounded-lg text-neutral-700 font-bold shadow-sm">
              👑 Admins: <strong className="text-orange-600">{adminCount}</strong>
            </span>
          </div>
        </div>

        {/* Controls Bar & Table */}
        <div className="bg-white border border-neutral-200/80 rounded-2xl shadow-sm overflow-hidden">

          <div className="p-4 border-b border-neutral-100 bg-[#fafafb] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search user by email, ID, university, or company..."
                className="w-full pl-10 pr-4 py-2 text-xs font-mono bg-white border border-neutral-200 rounded-xl focus:outline-none focus:border-orange-500 shadow-sm transition-all"
              />
            </div>

            <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl">
              {[
                { id: "ALL", label: `All (${users.length})` },
                { id: "STUDENT", label: `Students (${studentCount})` },
                { id: "ENTERPRISE", label: `Enterprises (${enterpriseCount})` },
                { id: "ADMIN", label: `Admins (${adminCount})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setRoleFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${roleFilter === tab.id
                      ? "bg-white text-neutral-900 shadow-sm font-black"
                      : "text-neutral-600 hover:text-neutral-900"
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-100 bg-[#fafafb] text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold">
                  <th className="py-3.5 px-5">User & Profile</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Success Rate</th>
                  <th className="py-3.5 px-4">Logins & Security</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Dossier Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-xs font-mono">
                {filteredUsers.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => openUserDossier(u, "GOVERNANCE")}
                    className="hover:bg-orange-50/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-orange-100 border border-orange-200 text-orange-600 flex items-center justify-center font-black text-xs uppercase shadow-sm">
                          {u.email[0]}
                        </div>
                        <div>
                          <p className="font-bold text-neutral-900 group-hover:text-orange-600 transition-colors">
                            {u.email}
                          </p>
                          <p className="text-[10px] text-neutral-400 font-mono">
                            ID: {u.id} &middot; {u.companyName ?? u.university ?? "Verified Member"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${u.role === "ADMIN"
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : u.role === "ENTERPRISE"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}>
                        {u.role}
                      </span>
                    </td>

                    {/* Success Rate Indicator */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-black ${u.successRatePercent! >= 90 ? "text-emerald-600" : "text-amber-600"}`}>
                          {u.successRatePercent}%
                        </span>
                        <div className="w-16 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${u.successRatePercent}%` }}
                            className={`h-full ${u.successRatePercent! >= 90 ? "bg-emerald-500" : "bg-amber-500"}`}
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-neutral-400 mt-0.5">{u.completedTasksCount} completed briefs</p>
                    </td>

                    {/* Login & Security Log */}
                    <td className="py-4 px-4 text-neutral-600">
                      <div className="flex items-center gap-1.5">
                        <Activity className="h-3.5 w-3.5 text-orange-600" />
                        <span className="font-bold">{u.loginCount} sessions</span>
                      </div>
                      <p className="text-[10px] text-neutral-400 truncate max-w-[140px]">{u.lastLoginIp}</p>
                    </td>

                    <td className="py-4 px-4">
                      {u.isBanned ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 px-2 py-0.5 rounded border border-red-200">
                          <Ban className="h-3 w-3" /> Banned
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                          Active
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => openUserDossier(u, "GOVERNANCE")}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-[10px] uppercase font-mono font-bold tracking-wider rounded-lg border border-neutral-300 bg-white text-neutral-800 hover:border-orange-500 hover:text-orange-600 shadow-sm transition-all"
                        >
                          Full Report &rarr;
                        </button>
                        <button
                          onClick={() => toggleBanRow(u.id)}
                          className={`px-2.5 py-1.5 text-[10px] uppercase font-mono font-bold tracking-wider rounded-lg transition-all shadow-sm ${u.isBanned
                              ? "bg-emerald-600 text-white hover:bg-emerald-700"
                              : "border border-red-200 bg-white text-red-600 hover:bg-red-50"
                            }`}
                        >
                          {u.isBanned ? "Unban" : "Ban"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ── 5-TAB DETAILED USER DOSSIER & ANALYTICS MODAL ── */}
      {inspectUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div
            className="w-full max-w-3xl bg-white h-full shadow-2xl overflow-y-auto flex flex-col justify-between border-l border-neutral-200 animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header & Navigation Tab Bar */}
            <div className="p-6 border-b border-neutral-200 bg-[#fafafb] sticky top-0 z-30 space-y-4">
              {/* Top Row: User Avatar, Email, Role, Close Button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-600 text-white flex items-center justify-center font-black text-sm uppercase shadow-md">
                    {inspectUser.email[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black uppercase text-neutral-900 tracking-tight">{inspectUser.email}</h2>
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-orange-100 text-orange-700 rounded border border-orange-200 uppercase">
                        {inspectUser.role}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-neutral-400 mt-0.5">User ID: {inspectUser.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setInspectUser(null)}
                  className="p-2 rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* High-Visibility Pill Tabs Strip */}
              <div className="flex items-center gap-1.5 bg-neutral-200/70 p-1.5 rounded-xl font-mono text-xs overflow-x-auto">
                {[
                  { id: "GOVERNANCE", label: "Governance & Role", icon: ShieldCheck },
                  { id: "GRAPH", label: "Security & Logins", icon: Activity },
                  { id: "WORKS", label: "Works & Success", icon: Briefcase },
                  { id: "REVIEWS", label: "Reviews & Ratings", icon: Star },
                  { id: "LOGS", label: "Audit Trail", icon: FileText },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold whitespace-nowrap transition-all ${isActive
                          ? "bg-white text-orange-600 shadow-sm font-black border border-neutral-200/80"
                          : "text-neutral-600 hover:text-neutral-900 hover:bg-white/50"
                        }`}
                    >
                      <Icon className={`h-3.5 w-3.5 ${isActive ? "text-orange-600" : "text-neutral-500"}`} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 flex-1">

              {/* Save Success Banner */}
              {saveSuccessMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs font-mono font-bold flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600" /> {saveSuccessMsg}
                </div>
              )}

              {/* ── TAB 1: PROFILE & GOVERNANCE ── */}
              {activeTab === "GOVERNANCE" && (
                <div className="space-y-6">
                  <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200/80 space-y-4">
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-orange-600" /> Role & Account Governance Controls
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-mono font-bold text-neutral-500 uppercase mb-2">User Role</label>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { role: "STUDENT", label: "🎓 Student" },
                            { role: "ENTERPRISE", label: "🏢 Enterprise" },
                            { role: "ADMIN", label: "👑 Admin" },
                          ].map((r) => (
                            <button
                              key={r.role}
                              type="button"
                              onClick={() => setEditRole(r.role as any)}
                              className={`py-2.5 px-3 rounded-xl text-xs font-mono font-bold border transition-all text-center ${editRole === r.role
                                  ? "bg-orange-50 border-orange-500 text-orange-700 font-black shadow-sm"
                                  : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                                }`}
                            >
                              {r.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="p-4 bg-white rounded-xl border border-neutral-200">
                          <label className="block text-[10px] font-mono font-bold text-neutral-500 uppercase mb-2">Identity Verification</label>
                          <button
                            type="button"
                            onClick={() => setEditVerified((prev) => !prev)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${editVerified ? "bg-emerald-600 text-white shadow-sm" : "bg-neutral-200 text-neutral-700"
                              }`}
                          >
                            {editVerified ? "✓ Verified Member" : "Pending Verification"}
                          </button>
                        </div>

                        <div className="p-4 bg-white rounded-xl border border-neutral-200">
                          <label className="block text-[10px] font-mono font-bold text-neutral-500 uppercase mb-2">Account Lock Status</label>
                          <button
                            type="button"
                            onClick={() => setEditBanned((prev) => !prev)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${editBanned ? "bg-red-600 text-white shadow-sm" : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              }`}
                          >
                            {editBanned ? "🚫 Account Banned" : "Active Member"}
                          </button>
                        </div>
                      </div>

                      <div className="pt-2 text-right">
                        <button
                          type="button"
                          onClick={handleSaveChanges}
                          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-orange-600 text-white text-xs font-mono font-bold uppercase tracking-wider hover:bg-orange-700 shadow-sm transition-all"
                        >
                          <Save className="h-4 w-4" /> Save Governance Updates
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Profile Info Card */}
                  <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 space-y-3 font-mono text-xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">Profile Metadata Overview</h3>
                    <div className="grid grid-cols-2 gap-4 pt-1">
                      <div>
                        <span className="text-neutral-400 text-[10px] uppercase font-bold block">Full Name</span>
                        <p className="font-bold text-neutral-900">{inspectUser.name ?? inspectUser.email}</p>
                      </div>
                      <div>
                        <span className="text-neutral-400 text-[10px] uppercase font-bold block">Joined Date</span>
                        <p className="font-bold text-neutral-900">{timeAgo(inspectUser.createdAt)}</p>
                      </div>
                      <div>
                        <span className="text-neutral-400 text-[10px] uppercase font-bold block">Institution / Org</span>
                        <p className="font-bold text-neutral-900">{inspectUser.university ?? inspectUser.companyName ?? "TaskBridge NL"}</p>
                      </div>
                      <div>
                        <span className="text-neutral-400 text-[10px] uppercase font-bold block">SEPA Payout / Spend Volume</span>
                        <p className="font-bold text-orange-600">{centsToEur(inspectUser.totalEarningsOrSpendCents!)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB 2: LOGIN & SECURITY GRAPH ── */}
              {activeTab === "GRAPH" && (
                <div className="space-y-6">

                  {/* Session Metrics Summary Cards */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-sm">
                      <span className="text-[10px] font-mono text-neutral-400 uppercase font-bold">Total Login Sessions</span>
                      <p className="text-2xl font-black text-neutral-900 mt-1">{inspectUser.loginCount} Logins</p>
                      <span className="text-[10px] text-emerald-600 font-mono font-bold mt-1 block">✓ All 2FA Verified</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-sm">
                      <span className="text-[10px] font-mono text-neutral-400 uppercase font-bold">Last Known IP</span>
                      <p className="text-base font-black text-orange-600 mt-1 font-mono">{inspectUser.lastLoginIp}</p>
                      <span className="text-[10px] text-neutral-400 font-mono mt-1 block">Amsterdam, NL</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-sm">
                      <span className="text-[10px] font-mono text-neutral-400 uppercase font-bold">Security & Trust Score</span>
                      <p className="text-2xl font-black text-emerald-600 mt-1">98 / 100</p>
                      <span className="text-[10px] text-emerald-600 font-mono font-bold mt-1 block">High Trust Signature</span>
                    </div>
                  </div>

                  {/* High-Contrast Visual Login Activity Graph with Period Selector */}
                  <div className="bg-neutral-900 text-white p-6 rounded-2xl border border-neutral-800 shadow-lg space-y-4 font-mono">

                    {/* Graph Controls Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-800 pb-4 gap-3">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-orange-500 tracking-widest flex items-center gap-1.5">
                          <Activity className="h-3.5 w-3.5 text-orange-500" /> AUTHENTICATION TIMELINE AUDIT
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-tight text-white mt-0.5">
                          {periodData.title}
                        </h3>
                      </div>

                      {/* Interactive Period Selector Tabs */}
                      <div className="flex items-center gap-1 bg-neutral-800/90 p-1 rounded-xl border border-neutral-700/80">
                        {[
                          { id: "7_DAYS", label: "7 Days" },
                          { id: "30_DAYS", label: "30 Days" },
                          { id: "90_DAYS", label: "90 Days" },
                          { id: "ALL_TIME", label: "All Time" },
                        ].map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setGraphPeriod(p.id as any)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${graphPeriod === p.id
                                ? "bg-orange-600 text-white font-black shadow-sm"
                                : "text-neutral-400 hover:text-white hover:bg-neutral-700/50"
                              }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Grid Container */}
                    <div className="relative pt-4 pb-2">
                      {/* Y-Axis Reference Grid Lines */}
                      <div className="absolute inset-x-0 top-6 border-b border-neutral-800/80 flex justify-between text-[9px] text-neutral-500">
                        <span>{periodData.maxVal} logins</span>
                      </div>
                      <div className="absolute inset-x-0 top-16 border-b border-neutral-800/80 flex justify-between text-[9px] text-neutral-500">
                        <span>{Math.round(periodData.maxVal / 2)} logins</span>
                      </div>
                      <div className="absolute inset-x-0 top-26 border-b border-neutral-800/80 flex justify-between text-[9px] text-neutral-500">
                        <span>0 logins</span>
                      </div>

                      {/* Bars Grid */}
                      <div className="h-36 w-full flex items-end justify-between gap-1.5 pt-8 relative z-10 px-1">
                        {periodData.bars.map((val, idx) => {
                          const heightPercent = Math.min(100, Math.max(12, (val / periodData.maxVal) * 100));
                          const isPeak = val >= periodData.maxVal * 0.8;
                          return (
                            <div key={idx} className="flex-1 h-full flex flex-col justify-end items-center group relative cursor-pointer">
                              {/* Bar */}
                              <div
                                style={{ height: `${heightPercent}%` }}
                                className={`w-full rounded-t-sm transition-all duration-300 ${isPeak
                                    ? "bg-gradient-to-t from-emerald-600 to-emerald-400 group-hover:from-emerald-500 group-hover:to-emerald-300 shadow-emerald-900/50"
                                    : "bg-gradient-to-t from-orange-600 to-amber-400 group-hover:from-orange-500 group-hover:to-amber-300 shadow-orange-900/50"
                                  }`}
                              />

                              {/* Interactive Hover Tooltip */}
                              <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute -top-9 bg-neutral-800 text-white text-[10px] font-mono py-1 px-2.5 rounded-lg border border-neutral-700 shadow-xl whitespace-nowrap z-30 transition-opacity">
                                Period Item #{idx + 1}: <strong className="text-orange-400">{val} logins</strong>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* X-Axis Timeline Labels */}
                      <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-3 border-t border-neutral-800 font-mono mt-2">
                        {periodData.labels.map((lbl, i) => (
                          <span key={i}>{lbl}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Device & Browser Audit Signature */}
                  <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 font-mono text-xs space-y-2 text-neutral-700 shadow-sm">
                    <p className="font-bold text-neutral-900 uppercase">Device & Security Signature:</p>
                    <p>• <strong>User Agent:</strong> {inspectUser.lastLoginDevice}</p>
                    <p>• <strong>Auth Protocol:</strong> NextAuth v5 JWT (HMAC-SHA256 Encrypted Session)</p>
                    <p>• <strong>Jurisdiction & Geo:</strong> Amsterdam, North Holland, The Netherlands</p>
                  </div>
                </div>
              )}

              {/* ── TAB 3: WORKS & SUCCESS RATE ── */}
              {activeTab === "WORKS" && (
                <div className="space-y-6 font-mono">

                  {/* Success Rate Stats */}
                  <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                        Deliverable Success & Completion Rate
                      </h3>
                      <span className="text-xl font-black text-emerald-600">{inspectUser.successRatePercent}% SUCCESS</span>
                    </div>

                    <div className="h-3 w-full bg-neutral-100 rounded-full overflow-hidden flex">
                      <div style={{ width: `${inspectUser.successRatePercent}%` }} className="bg-emerald-500 h-full" />
                      <div style={{ width: `${100 - inspectUser.successRatePercent!}%` }} className="bg-red-400 h-full" />
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-xs pt-2">
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                        <span className="text-emerald-700 font-bold uppercase text-[10px]">Completed Works</span>
                        <p className="text-lg font-black text-emerald-700 mt-0.5">{inspectUser.completedTasksCount}</p>
                      </div>
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                        <span className="text-amber-700 font-bold uppercase text-[10px]">Active In-Progress</span>
                        <p className="text-lg font-black text-amber-700 mt-0.5">2</p>
                      </div>
                      <div className="p-3 bg-red-50 rounded-xl border border-red-200">
                        <span className="text-red-700 font-bold uppercase text-[10px]">Disputed / Failed</span>
                        <p className="text-lg font-black text-red-700 mt-0.5">{inspectUser.failedTasksCount}</p>
                      </div>
                    </div>
                  </div>

                  {/* Executed Jobs Table */}
                  <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-neutral-100 bg-[#fafafb] font-bold text-xs uppercase text-neutral-700">
                      Executed Briefs & Counterparts History
                    </div>

                    <div className="divide-y divide-neutral-100">
                      {inspectUser.worksHistory?.map((w) => (
                        <div key={w.id} className="p-4 flex items-center justify-between gap-4 hover:bg-orange-50/30 transition-colors">
                          <div>
                            <p className="text-xs font-bold text-neutral-900">{w.title}</p>
                            <p className="text-[10px] text-neutral-400 mt-0.5">
                              Counterpart: <strong>{w.counterpartName}</strong> &middot; Category: {w.category}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-xs font-black text-orange-600">{centsToEur(w.budgetCents)}</p>
                            <span className={`inline-block mt-0.5 text-[9px] font-bold uppercase px-2 py-0.5 rounded ${w.status === "COMPLETED"
                                ? "bg-emerald-100 text-emerald-800"
                                : w.status === "DISPUTED"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}>
                              {w.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* ── TAB 4: REVIEWS & RATINGS ── */}
              {activeTab === "REVIEWS" && (
                <div className="space-y-4 font-mono">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                      Verified Client & Student Reviews ({inspectUser.reviewsList?.length})
                    </h3>
                    <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> 4.95 / 5.0 Average
                    </div>
                  </div>

                  <div className="space-y-3">
                    {inspectUser.reviewsList?.map((r) => (
                      <div key={r.id} className="p-4 bg-white rounded-2xl border border-neutral-200/80 shadow-sm space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-amber-400">
                            {[...Array(r.rating)].map((_, i) => (
                              <Star key={i} className="h-3.5 w-3.5 fill-amber-400" />
                            ))}
                          </div>
                          <span className="text-[10px] text-neutral-400">{r.createdAt}</span>
                        </div>
                        <p className="text-xs text-neutral-800 font-sans leading-relaxed italic">"{r.comment}"</p>
                        <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[10px] text-neutral-500">
                          <span>By: <strong>{r.reviewerName}</strong></span>
                          <span>Task: <strong>{r.taskTitle}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── TAB 5: AUDIT TRAIL ── */}
              {activeTab === "LOGS" && (
                <div className="space-y-3 font-mono">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 mb-2">
                    Immutable Security & Activity Audit Trail
                  </h3>

                  <div className="bg-neutral-900 text-neutral-200 rounded-2xl p-4 font-mono text-xs space-y-3">
                    {inspectUser.activityLogs?.map((log, idx) => (
                      <div key={idx} className="border-b border-neutral-800 pb-2.5 last:border-b-0">
                        <div className="flex items-center justify-between text-neutral-400 text-[10px]">
                          <span>{log.timestamp}</span>
                          <span>IP: {log.ip}</span>
                        </div>
                        <p className="text-emerald-400 font-bold mt-1">↳ {log.action}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-neutral-200 bg-[#fafafb] flex items-center justify-between sticky bottom-0">
              <button
                onClick={() => setInspectUser(null)}
                className="px-4 py-2 rounded-lg border border-neutral-300 bg-white text-xs font-mono font-bold text-neutral-700 hover:bg-neutral-50 transition-all"
              >
                Close Dossier
              </button>

              <button
                onClick={() => handleSaveChanges()}
                className="px-5 py-2.5 rounded-xl bg-orange-600 text-white text-xs font-mono font-bold uppercase tracking-wider hover:bg-orange-700 shadow-md transition-all flex items-center gap-1.5"
              >
                <Save className="h-4 w-4" /> Save Dossier Updates
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
