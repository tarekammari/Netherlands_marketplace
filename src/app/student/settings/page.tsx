"use client";

/**
 * src/app/student/settings/page.tsx
 *
 * Professional Multi-Tab Account & Platform Settings Suite for Students.
 * Includes Account & Security, Stripe Payouts & IBAN, Notifications, and Academic Verification.
 */

import { useState } from "react";
import Link from "next/link";
import {
  Shield,
  CreditCard,
  Bell,
  GraduationCap,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Loader2,
} from "lucide-react";

export default function StudentSettingsPage() {
  const [activeTab, setActiveTab] = useState<"account" | "payouts" | "notifications" | "verification">("account");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Notification Switches
  const [notifTasks, setNotifTasks] = useState(true);
  const [notifApplications, setNotifApplications] = useState(true);
  const [notifPayments, setNotifPayments] = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New password and confirmation do not match." });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);
      // Simulate password change API call
      await new Promise((res) => setTimeout(res, 800));
      setMessage({ type: "success", text: "Security credentials updated successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setMessage({ type: "error", text: "Failed to update password." });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    setMessage(null);
    await new Promise((res) => setTimeout(res, 600));
    setMessage({ type: "success", text: "Notification preferences saved." });
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-[#fafafb] text-neutral-900 py-12 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 mb-8 text-xs font-mono">
          <Link
            href="/student/dashboard"
            className="text-neutral-500 hover:text-orange-600 transition-colors flex items-center gap-1 font-bold"
          >
            <ArrowLeft size={13} />
            DASHBOARD
          </Link>
          <span className="text-neutral-300">/</span>
          <span className="text-orange-600 font-bold uppercase tracking-wider">
            ACCOUNT SETTINGS
          </span>
        </div>

        {/* Page Title Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/80 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 uppercase tracking-tight">
              ACCOUNT & PLATFORM SETTINGS
            </h1>
            <p className="text-xs sm:text-sm text-neutral-600 font-normal mt-1">
              Manage your security credentials, Stripe payout IBAN, notification preferences, and academic verification.
            </p>
          </div>
          <Link
            href="/student/profile"
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-neutral-800 hover:border-orange-500 hover:text-orange-600 shadow-sm transition-all"
          >
            <User size={14} />
            View Public Profile &rarr;
          </Link>
        </div>

        {/* Feedback Alert */}
        {message && (
          <div
            className={`p-4 rounded-xl mb-6 text-xs font-mono font-bold flex items-center gap-2 ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            <CheckCircle2 size={16} />
            {message.text}
          </div>
        )}

        {/* Layout Grid: Sidebar Tabs + Settings Content Area */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Sidebar Tabs */}
          <div className="space-y-1">
            <button
              onClick={() => { setActiveTab("account"); setMessage(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-mono font-bold transition-all text-left cursor-pointer ${
                activeTab === "account"
                  ? "bg-orange-600 text-white shadow-md shadow-orange-500/20"
                  : "bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200/60"
              }`}
            >
              <Shield size={16} />
              Account & Security
            </button>

            <button
              onClick={() => { setActiveTab("payouts"); setMessage(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-mono font-bold transition-all text-left cursor-pointer ${
                activeTab === "payouts"
                  ? "bg-orange-600 text-white shadow-md shadow-orange-500/20"
                  : "bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200/60"
              }`}
            >
              <CreditCard size={16} />
              Payout Methods (Get Paid)
            </button>

            <button
              onClick={() => { setActiveTab("notifications"); setMessage(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-mono font-bold transition-all text-left cursor-pointer ${
                activeTab === "notifications"
                  ? "bg-orange-600 text-white shadow-md shadow-orange-500/20"
                  : "bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200/60"
              }`}
            >
              <Bell size={16} />
              Notifications
            </button>

            <button
              onClick={() => { setActiveTab("verification"); setMessage(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-mono font-bold transition-all text-left cursor-pointer ${
                activeTab === "verification"
                  ? "bg-orange-600 text-white shadow-md shadow-orange-500/20"
                  : "bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200/60"
              }`}
            >
              <GraduationCap size={16} />
              Academic Status
            </button>
          </div>

          {/* Settings Main Panel */}
          <div className="md:col-span-3">
            
            {/* ── TAB 1: Account & Security ── */}
            {activeTab === "account" && (
              <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 md:p-8 shadow-sm space-y-8">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="text-orange-600" size={18} />
                    <h2 className="text-base font-bold text-neutral-900 uppercase tracking-wider">
                      Security & Credentials
                    </h2>
                  </div>
                  <p className="text-xs text-neutral-500">
                    Update your access password and security settings.
                  </p>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-5 border-t border-neutral-100 pt-6">
                  <div>
                    <label className="block text-xs font-mono font-bold text-neutral-700 uppercase tracking-wider mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-medium"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono font-bold text-neutral-700 uppercase tracking-wider mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-medium"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-bold text-neutral-700 uppercase tracking-wider mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-medium"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center rounded-xl bg-neutral-900 px-6 py-3 text-xs uppercase font-bold tracking-widest text-white hover:bg-orange-600 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin mr-2" /> : <Lock size={14} className="mr-2" />}
                    Update Security Password
                  </button>
                </form>
              </div>
            )}

            {/* ── TAB 2: Payout Methods (Get Paid) ── */}
            {activeTab === "payouts" && (
              <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 md:p-8 shadow-sm space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard className="text-orange-600" size={18} />
                    <h2 className="text-base font-bold text-neutral-900 uppercase tracking-wider">
                      Payout Methods & Direct Deposit
                    </h2>
                  </div>
                  <p className="text-xs text-neutral-500">
                    Manage your Dutch SEPA IBAN bank account for automatic milestone escrow withdrawals.
                  </p>
                </div>

                <div className="border border-emerald-200 bg-emerald-50/60 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                      &euro;
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-neutral-900">SEPA Direct Bank Transfer</h3>
                        <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded border border-emerald-300">
                          PRIMARY PAYOUT METHOD
                        </span>
                      </div>
                      <p className="text-xs text-neutral-600 font-mono mt-1">
                        Dutch IBAN (ING / ABN AMRO / Rabobank / Bunq) via Stripe Connect Express.
                      </p>
                    </div>
                  </div>

                  <a
                    href="/api/stripe/connect/onboard"
                    className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-emerald-700 transition-all shadow-sm flex-shrink-0"
                  >
                    Manage IBAN & Tax Info <ExternalLink size={13} className="ml-1.5" />
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="border border-neutral-100 rounded-xl p-4 bg-neutral-50/50">
                    <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Payout Schedule</span>
                    <div className="text-sm font-bold text-neutral-900 mt-1">Milestone Escrow Release</div>
                  </div>
                  <div className="border border-neutral-100 rounded-xl p-4 bg-neutral-50/50">
                    <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Payout Currency</span>
                    <div className="text-sm font-bold text-neutral-900 mt-1">Euro (&euro; SEPA)</div>
                  </div>
                  <div className="border border-neutral-100 rounded-xl p-4 bg-neutral-50/50">
                    <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Transfer Fees</span>
                    <div className="text-sm font-bold text-emerald-600 mt-1">0% (Fee-Free for Talent)</div>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 3: Notifications ── */}
            {activeTab === "notifications" && (
              <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 md:p-8 shadow-sm space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Bell className="text-orange-600" size={18} />
                    <h2 className="text-base font-bold text-neutral-900 uppercase tracking-wider">
                      Email & Platform Alerts
                    </h2>
                  </div>
                  <p className="text-xs text-neutral-500">
                    Configure real-time notifications for task briefs, applications, and payouts.
                  </p>
                </div>

                <div className="space-y-4 border-t border-neutral-100 pt-6">
                  {[
                    { title: "New Task Brief Alerts", desc: "Get notified when new briefs matching your university skills are published", state: notifTasks, setState: setNotifTasks },
                    { title: "Application Selection & Status", desc: "Receive instant email updates when an enterprise selects your proposal", state: notifApplications, setState: setNotifApplications },
                    { title: "Stripe Escrow & Payout Receipts", desc: "Get notified when milestone funds are locked or released to your bank", state: notifPayments, setState: setNotifPayments },
                    { title: "Direct Client Messages", desc: "Receive email notifications when an enterprise sends you a message", state: notifMessages, setState: setNotifMessages },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 border border-neutral-100 rounded-xl hover:bg-neutral-50/50 transition-colors">
                      <div>
                        <div className="text-xs font-bold text-neutral-900">{item.title}</div>
                        <div className="text-[11px] text-neutral-500 mt-0.5">{item.desc}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => item.setState(!item.state)}
                        className={`w-12 h-6 rounded-full transition-colors p-0.5 relative cursor-pointer ${
                          item.state ? "bg-orange-600" : "bg-neutral-300"
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full bg-white transition-transform ${item.state ? "translate-x-6" : "translate-x-0"}`} />
                      </button>
                    </div>
                  ))}

                  <div className="pt-4 text-right">
                    <button
                      onClick={handleSaveNotifications}
                      disabled={saving}
                      className="inline-flex items-center justify-center rounded-xl bg-orange-600 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-orange-700 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                    >
                      {saving ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Save size={14} className="mr-1.5" />}
                      Save Notification Preferences
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 4: Academic Verification ── */}
            {activeTab === "verification" && (
              <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 md:p-8 shadow-sm space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <GraduationCap className="text-orange-600" size={18} />
                    <h2 className="text-base font-bold text-neutral-900 uppercase tracking-wider">
                      University Domain Authentication
                    </h2>
                  </div>
                  <p className="text-xs text-neutral-500">
                    Verified status is active. Your account is authenticated against official Dutch university domain registries.
                  </p>
                </div>

                <div className="border border-neutral-200 rounded-2xl p-6 bg-[#fafafb]">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-orange-600 text-white flex items-center justify-center font-black text-sm flex-shrink-0">
                      TUD
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wide">
                          Delft University of Technology (TU Delft)
                        </h3>
                        <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          VERIFIED
                        </span>
                      </div>
                      <p className="text-xs text-neutral-600 font-mono mt-1">
                        Authenticated Academic Domain: <span className="font-bold text-orange-600">@tudelft.nl</span>
                      </p>
                      <p className="text-xs text-neutral-500 mt-2 font-normal">
                        Your university credentials allow you to apply for high-caliber briefs commissioned by top Dutch enterprises.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
