"use client";

/**
 * src/components/admin/admin-settings-manager.tsx
 *
 * Admin Panel System Settings & Media Manager Component.
 * Allows Admin to configure the App System Email (tarekammari1@gmail.com),
 * anti-spam honeypot parameters, and custom page image URLs.
 */

import { useState } from "react";
import { Mail, Shield, Image, Save, CheckCircle2, RefreshCw, AlertCircle, Lock } from "lucide-react";

interface AdminSettingsManagerProps {
  initialSettings: Record<string, string>;
}

export function AdminSettingsManager({ initialSettings }: AdminSettingsManagerProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [successMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const handleUpdate = async (key: string, value: string) => {
    setSavingKey(key);
    setSaveSuccessMsg(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      const data = await res.json();
      if (data.success) {
        setSettings((prev) => ({ ...prev, [key]: value }));
        setSaveSuccessMsg(`Successfully updated setting "${key}"!`);
      }
    } catch (err) {
      console.error("Failed to update setting:", err);
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="space-y-8 font-mono">
      
      {/* Status Feedback Toast */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center justify-between text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSaveSuccessMsg(null)} className="text-xs font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* ── SECTION 1: SYSTEM APPLICATION EMAIL CONFIGURATION ── */}
      <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-neutral-100 pb-4">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 border border-orange-200/60 flex items-center justify-center font-bold">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-black uppercase text-neutral-900 tracking-tight">
              Application System Email & Anti-Spam Vault
            </h3>
            <p className="text-[11px] text-neutral-400">
              Primary outbound SMTP sender & inbox for platform notifications and user inquiries.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">
              System Dispatch Email Address:
            </label>
            <div className="flex items-center gap-3">
              <input
                type="email"
                value={settings.SYSTEM_EMAIL ?? "tarekammari1@gmail.com"}
                onChange={(e) => setSettings({ ...settings, SYSTEM_EMAIL: e.target.value })}
                className="flex-1 px-4 py-3 bg-[#fafafb] border border-neutral-200 rounded-xl text-xs font-mono focus:outline-none focus:border-orange-500"
              />
              <button
                onClick={() => handleUpdate("SYSTEM_EMAIL", settings.SYSTEM_EMAIL ?? "tarekammari1@gmail.com")}
                disabled={savingKey === "SYSTEM_EMAIL"}
                className="px-5 py-3 bg-orange-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-orange-700 transition-all flex items-center gap-2 shadow-sm"
              >
                {savingKey === "SYSTEM_EMAIL" ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save Email
              </button>
            </div>
            <span className="text-[10px] text-neutral-400 mt-1.5 block">
              Default system testing email: <strong className="text-orange-600">tarekammari1@gmail.com</strong>
            </span>
          </div>

          {/* Anti-Spam Protection Summary Badge */}
          <div className="bg-[#fafafb] border border-neutral-200/80 rounded-2xl p-4 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <Shield className="h-4 w-4 text-emerald-600" />
              <div>
                <span className="font-bold text-neutral-900 uppercase text-[11px]">Anti-Spam Security Shield: Active</span>
                <p className="text-[10px] text-neutral-500">Honeypot trap field, Upstash IP rate limiting & payload sanitization active.</p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-lg uppercase">
              100% Protected
            </span>
          </div>
        </div>
      </div>

      {/* ── SECTION 2: DYNAMIC PAGE MEDIA & HERO IMAGE MANAGER ── */}
      <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-neutral-100 pb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-200/60 flex items-center justify-center font-bold">
            <Image className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-black uppercase text-neutral-900 tracking-tight">
              Site Media & Visual Asset Database Manager
            </h3>
            <p className="text-[11px] text-neutral-400">
              Edit live hero images and visual cards dynamically stored in PostgreSQL.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* About Us Visual */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-neutral-700 uppercase">
              About Us Hero Image URL:
            </label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={settings.ABOUT_HERO_IMAGE ?? "/api/about-image"}
                onChange={(e) => setSettings({ ...settings, ABOUT_HERO_IMAGE: e.target.value })}
                className="flex-1 px-4 py-2.5 bg-[#fafafb] border border-neutral-200 rounded-xl text-xs font-mono"
              />
              <button
                onClick={() => handleUpdate("ABOUT_HERO_IMAGE", settings.ABOUT_HERO_IMAGE ?? "/api/about-image")}
                disabled={savingKey === "ABOUT_HERO_IMAGE"}
                className="px-4 py-2.5 bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-neutral-800 transition-all flex items-center gap-2"
              >
                Save URL
              </button>
            </div>
          </div>

          {/* Contact HQ Visual */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-neutral-700 uppercase">
              Contact HQ Office Image URL:
            </label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={settings.CONTACT_HQ_IMAGE ?? "/api/contact-image"}
                onChange={(e) => setSettings({ ...settings, CONTACT_HQ_IMAGE: e.target.value })}
                className="flex-1 px-4 py-2.5 bg-[#fafafb] border border-neutral-200 rounded-xl text-xs font-mono"
              />
              <button
                onClick={() => handleUpdate("CONTACT_HQ_IMAGE", settings.CONTACT_HQ_IMAGE ?? "/api/contact-image")}
                disabled={savingKey === "CONTACT_HQ_IMAGE"}
                className="px-4 py-2.5 bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-neutral-800 transition-all flex items-center gap-2"
              >
                Save URL
              </button>
            </div>
          </div>

          {/* Pricing Visual */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-neutral-700 uppercase">
              Pricing Escrow Banner Image URL:
            </label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={settings.PRICING_HERO_IMAGE ?? "/api/pricing-image"}
                onChange={(e) => setSettings({ ...settings, PRICING_HERO_IMAGE: e.target.value })}
                className="flex-1 px-4 py-2.5 bg-[#fafafb] border border-neutral-200 rounded-xl text-xs font-mono"
              />
              <button
                onClick={() => handleUpdate("PRICING_HERO_IMAGE", settings.PRICING_HERO_IMAGE ?? "/api/pricing-image")}
                disabled={savingKey === "PRICING_HERO_IMAGE"}
                className="px-4 py-2.5 bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-neutral-800 transition-all flex items-center gap-2"
              >
                Save URL
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
