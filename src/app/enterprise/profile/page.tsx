"use client";

/**
 * src/app/enterprise/profile/page.tsx
 *
 * Luxury Light Theme Enterprise Company Profile Management Page.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  Save,
  Loader2,
  Globe,
  ArrowLeft,
  PlusCircle,
} from "lucide-react";

export default function EnterpriseProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("Technology & Software");
  const [companySize, setCompanySize] = useState("11-50");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [bio, setBio] = useState("");
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/enterprise/profile");
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          router.push("/login?callbackUrl=/enterprise/profile");
          return;
        }
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to load company profile");
      }

      const json = await res.json();
      if (json.success) {
        const u = json.data.user;
        const p = json.data.profile;

        setName(u.name || "");
        setEmail(u.email || "");
        setIsVerified(u.isVerified || false);

        if (p) {
          setCompanyName(p.companyName || "");
          setIndustry(p.industry || "Technology & Software");
          setCompanySize(p.companySize || "11-50");
          setWebsiteUrl(p.websiteUrl || "");
          setBio(p.bio || "");
        }
      }
    } catch (err: any) {
      console.error(err);
      setMessage({ type: "error", text: err.message || "Failed to load company profile." });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage(null);

      const res = await fetch("/api/enterprise/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          companyName,
          industry,
          companySize,
          websiteUrl,
          bio,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to update company profile");
      }

      setMessage({ type: "success", text: "Company profile updated successfully." });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to save profile." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafb] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
          <span className="font-mono text-xs text-neutral-500 uppercase tracking-widest font-bold">
            Loading Company Profile...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafb] text-neutral-900 py-12 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Navigation Breadcrumb */}
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
            COMPANY PROFILE
          </span>
        </div>

        {/* Profile Banner */}
        <div className="bg-[#111827] text-white rounded-3xl border border-neutral-800 p-8 md:p-10 shadow-xl mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 rounded-bl-full pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-orange-600 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-orange-600/30">
                {companyName ? companyName.slice(0, 1).toUpperCase() : "C"}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
                    {companyName || "Company Profile"}
                  </h1>
                  {isVerified && (
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800">
                      <CheckCircle2 size={11} /> KVK VALIDATED
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-neutral-400 font-mono">
                  {email} &middot; {industry}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/enterprise/tasks/new"
                className="inline-flex items-center justify-center rounded-lg bg-orange-600 px-5 py-2.5 text-xs uppercase font-bold tracking-wider text-white hover:bg-orange-500 active:scale-95 transition-all shadow-md"
              >
                <PlusCircle size={14} className="mr-1.5" />
                Commission Task
              </Link>
            </div>
          </div>
        </div>

        {/* Feedback Alert */}
        {message && (
          <div
            className={`p-4 rounded-xl mb-8 text-xs font-mono font-bold flex items-center gap-2 ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            <ShieldCheck size={16} />
            {message.text}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-2.5 mb-6 border-b border-neutral-100 pb-4">
              <Building2 className="text-orange-600" size={20} />
              <h2 className="text-base font-bold uppercase tracking-wider text-neutral-900">
                Enterprise Credentials & Details
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-mono font-bold text-neutral-700 uppercase tracking-wider mb-2">
                  Company Legal Name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Acme BV"
                  className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-medium transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-neutral-700 uppercase tracking-wider mb-2">
                  Primary Contact Person
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mark de Jong"
                  className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-medium transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-neutral-700 uppercase tracking-wider mb-2">
                  Industry Sector
                </label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-medium transition-all bg-white"
                >
                  <option value="Technology & Software">Technology & Software</option>
                  <option value="Financial Services & Fintech">Financial Services & Fintech</option>
                  <option value="Energy & Cleantech">Energy & Cleantech</option>
                  <option value="E-Commerce & Retail">E-Commerce & Retail</option>
                  <option value="Healthcare & Life Sciences">Healthcare & Life Sciences</option>
                  <option value="Consulting & Legal">Consulting & Legal</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-neutral-700 uppercase tracking-wider mb-2">
                  Company Size
                </label>
                <select
                  value={companySize}
                  onChange={(e) => setCompanySize(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-medium transition-all bg-white"
                >
                  <option value="1-10">1-10 Employees (Startup)</option>
                  <option value="11-50">11-50 Employees (Scaleup)</option>
                  <option value="51-200">51-200 Employees (Mid-market)</option>
                  <option value="201+">201+ Employees (Enterprise)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-mono font-bold text-neutral-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Globe size={14} className="text-neutral-500" />
                  Official Website URL
                </label>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://company.nl"
                  className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-medium transition-all"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-mono font-bold text-neutral-700 uppercase tracking-wider mb-2">
                  Company Bio & Commissioning Context
                </label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Describe your corporate mission, engineering challenges, or typical project briefs commissioned to Dutch university talent..."
                  className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-normal transition-all"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-xl bg-orange-600 px-8 py-3.5 text-xs uppercase font-bold tracking-widest text-white hover:bg-orange-700 active:scale-95 transition-all shadow-md disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  Saving Profile...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  Save Company Profile
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
