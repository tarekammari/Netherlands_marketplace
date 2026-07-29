"use client";

/**
 * src/app/enterprise/settings/page.tsx
 *
 * Professional Multi-Tab Account & Billing Settings Suite for Enterprise Clients.
 */

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Shield,
  CreditCard,
  Bell,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Loader2,
  ExternalLink,
} from "lucide-react";

export default function EnterpriseSettingsPage() {
  const [activeTab, setActiveTab] = useState<"account" | "billing" | "notifications">("account");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Security
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }
    setSaving(true);
    setMessage(null);
    await new Promise((res) => setTimeout(res, 800));
    setMessage({ type: "success", text: "Security credentials updated successfully." });
    setSaving(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="min-h-screen bg-[#fafafb] text-neutral-900 py-12 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8 text-xs font-mono">
          <Link
            href="/enterprise/dashboard"
            className="text-neutral-500 hover:text-orange-600 transition-colors flex items-center gap-1 font-bold"
          >
            <ArrowLeft size={13} />
            DASHBOARD
          </Link>
          <span className="text-neutral-300">/</span>
          <span className="text-orange-600 font-bold uppercase tracking-wider">
            ENTERPRISE SETTINGS
          </span>
        </div>

        {/* Title */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/80 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 uppercase tracking-tight">
              ENTERPRISE SETTINGS & BILLING
            </h1>
            <p className="text-xs sm:text-sm text-neutral-600 font-normal mt-1">
              Manage corporate security, Stripe Escrow payment methods, KVK validation, and team notifications.
            </p>
          </div>
          <Link
            href="/enterprise/profile"
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-neutral-800 hover:border-orange-500 hover:text-orange-600 shadow-sm transition-all"
          >
            <Building2 size={14} />
            Company Profile &rarr;
          </Link>
        </div>

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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
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
              onClick={() => { setActiveTab("billing"); setMessage(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-mono font-bold transition-all text-left cursor-pointer ${
                activeTab === "billing"
                  ? "bg-orange-600 text-white shadow-md shadow-orange-500/20"
                  : "bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200/60"
              }`}
            >
              <CreditCard size={16} />
              Stripe Escrow Billing
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
          </div>

          <div className="md:col-span-3">
            {activeTab === "account" && (
              <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 md:p-8 shadow-sm space-y-8">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="text-orange-600" size={18} />
                    <h2 className="text-base font-bold text-neutral-900 uppercase tracking-wider">
                      Corporate Account Security
                    </h2>
                  </div>
                  <p className="text-xs text-neutral-500">
                    Update corporate login credentials and password security.
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

            {activeTab === "billing" && (
              <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 md:p-8 shadow-sm space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard className="text-orange-600" size={18} />
                    <h2 className="text-base font-bold text-neutral-900 uppercase tracking-wider">
                      Stripe Escrow Payment Methods
                    </h2>
                  </div>
                  <p className="text-xs text-neutral-500">
                    Manage corporate credit cards, iDEAL payment authorization, and milestone deposit invoices.
                  </p>
                </div>

                <div className="border border-neutral-800 bg-[#111827] text-white rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold uppercase tracking-wide">Stripe Escrow Vault</h3>
                      <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                        ESCROW READY
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 font-mono mt-1">
                      Automated milestone locks with Dutch Law contracts.
                    </p>
                  </div>
                  <button
                    onClick={() => alert("Stripe Customer Portal will open.")}
                    className="inline-flex items-center justify-center rounded-xl bg-orange-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-orange-500 transition-all cursor-pointer"
                  >
                    Payment Methods <ExternalLink size={13} className="ml-1.5" />
                  </button>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 md:p-8 shadow-sm space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Bell className="text-orange-600" size={18} />
                    <h2 className="text-base font-bold text-neutral-900 uppercase tracking-wider">
                      Corporate Alerts & Brief Updates
                    </h2>
                  </div>
                  <p className="text-xs text-neutral-500">
                    Configure real-time alerts when top Dutch university students apply to your briefs.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
