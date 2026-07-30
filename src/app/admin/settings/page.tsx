/**
 * src/app/admin/settings/page.tsx
 *
 * Admin System Settings & Media Management Page.
 * Accessible only by ADMIN accounts.
 */

import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { AdminSettingsManager } from "@/components/admin/admin-settings-manager";

export const metadata: Metadata = { title: "System Settings — Admin Panel" };

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/");

  let settingsMap: Record<string, string> = {
    SYSTEM_EMAIL: process.env.EMAIL_FROM || "tarekammari1@gmail.com",
    ABOUT_HERO_IMAGE: "/api/about-image",
    CONTACT_HQ_IMAGE: "/api/contact-image",
    PRICING_HERO_IMAGE: "/api/pricing-image",
    SPAM_PROTECTION_ACTIVE: "true",
  };

  try {
    const settings = await db.systemSetting.findMany();
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });
  } catch (err: any) {
    console.warn("[AdminSettingsPage] DB offline or unseeded, using default settings:", err?.message);
  }

  return (
    <div className="min-h-screen bg-[#fafafb] py-10 font-sans">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Page Header & Top Navigation Button Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
          <div>
            <div className="text-[11px] font-mono tracking-[0.25em] uppercase font-bold text-orange-600 mb-1">
              SYSTEM CONFIGURATION & MEDIA VAULT
            </div>
            <h1 className="text-3xl font-black uppercase text-neutral-900 tracking-tight">
              Platform Settings
            </h1>
          </div>

          <div className="flex items-center gap-2 font-mono">
            <Link
              href="/admin"
              className="px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-xl border border-neutral-200 bg-white text-neutral-800 hover:border-orange-500 transition-all shadow-sm"
            >
              &larr; Admin Overview
            </Link>
            <Link
              href="/admin/users"
              className="px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-xl border border-neutral-200 bg-white text-neutral-800 hover:border-orange-500 transition-all shadow-sm"
            >
              👥 Manage Users
            </Link>
          </div>
        </div>

        {/* Manager Component */}
        <AdminSettingsManager initialSettings={settingsMap} />

      </div>
    </div>
  );
}
