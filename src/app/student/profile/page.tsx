"use client";

/**
 * src/app/student/profile/page.tsx
 *
 * Luxury Light Theme Student Profile Management & Verification Page.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  Globe,
  Linkedin,
  ArrowLeft,
  BookOpen,
  Sparkles,
  Save,
} from "lucide-react";

const DUTCH_UNIVERSITIES = [
  "TU Delft",
  "Univ. of Amsterdam",
  "TU Eindhoven",
  "Erasmus Rotterdam",
  "Utrecht University",
  "Leiden University",
  "Maastricht Univ.",
  "Univ. of Twente",
  "Groningen Univ.",
  "Vrije Universiteit",
  "Wageningen UR",
  "Radboud University",
];

const SKILLS_LIST = [
  "Data Analysis",
  "Python",
  "TypeScript",
  "React.js",
  "Financial Modeling",
  "Legal Research",
  "UX/UI Design",
  "Copywriting",
  "Digital Marketing",
  "Market Research",
  "SQL",
  "Machine Learning",
];

export default function StudentProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [university, setUniversity] = useState("TU Delft");
  const [studyField, setStudyField] = useState("Computer Science");
  const [yearOfStudy, setYearOfStudy] = useState(3);
  const [skills, setSkills] = useState<string[]>(["TypeScript", "React.js", "Data Analysis"]);
  const [bio, setBio] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [hourlyRateEur, setHourlyRateEur] = useState(25);
  const [isVerified, setIsVerified] = useState(false);
  const [stripeOnboarded, setStripeOnboarded] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/student/profile");
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          router.push("/login?callbackUrl=/student/profile");
          return;
        }
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to load student profile");
      }

      const json = await res.json();
      if (json.success) {
        const u = json.data.user;
        const p = json.data.profile;

        setName(u.name || "");
        setEmail(u.email || "");
        setIsVerified(u.isVerified || false);
        setStripeOnboarded(u.stripeOnboarded || false);

        if (p) {
          setUniversity(p.university || "TU Delft");
          setStudyField(p.studyField || "Computer Science");
          setYearOfStudy(p.yearOfStudy || 3);
          setSkills(p.skills || []);
          setBio(p.bio || "");
          setPortfolioUrl(p.portfolioUrl || "");
          setLinkedinUrl(p.linkedinUrl || "");
          setHourlyRateEur(p.hourlyRateCents ? Math.round(p.hourlyRateCents / 100) : 25);
        }
      }
    } catch (err: any) {
      console.error(err);
      setMessage({ type: "error", text: err.message || "Failed to load profile data." });
    } finally {
      setLoading(false);
    }
  };

  const handleSkillToggle = (skill: string) => {
    if (skills.includes(skill)) {
      setSkills(skills.filter((s) => s !== skill));
    } else {
      setSkills([...skills, skill]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage(null);

      const res = await fetch("/api/student/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          university,
          studyField,
          yearOfStudy: Number(yearOfStudy),
          skills,
          bio,
          portfolioUrl,
          linkedinUrl,
          hourlyRateCents: Math.round(hourlyRateEur * 100),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to update profile");
      }

      setMessage({ type: "success", text: "Your profile has been updated successfully." });
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
            Loading Academic Profile...
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
            href="/student/dashboard"
            className="text-neutral-500 hover:text-orange-600 transition-colors flex items-center gap-1 font-bold"
          >
            <ArrowLeft size={13} />
            DASHBOARD
          </Link>
          <span className="text-neutral-300">/</span>
          <span className="text-orange-600 font-bold uppercase tracking-wider">
            ACADEMIC PROFILE
          </span>
        </div>

        {/* Profile Banner */}
        <div className="bg-white rounded-3xl border border-neutral-200/80 p-8 md:p-10 shadow-[0_10px_30px_rgba(0,0,0,0.03)] mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/5 rounded-bl-full pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                {name ? name.slice(0, 1).toUpperCase() : "S"}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 uppercase tracking-tight">
                    {name || "Student Profile"}
                  </h1>
                  <span className={`inline-flex items-center gap-1 font-mono text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${
                    isVerified ? "text-emerald-600 bg-emerald-50 border-emerald-200" : "text-amber-600 bg-amber-50 border-amber-200"
                  }`}>
                    <CheckCircle2 size={11} /> {isVerified ? "VERIFIED STUDENT" : "UNVERIFIED STUDENT"}
                  </span>
                  {stripeOnboarded && (
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                      <ShieldCheck size={11} /> PAYOUTS READY
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-neutral-600 font-mono">
                  {email} &middot; {university}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/tasks"
                className="inline-flex items-center justify-center rounded-lg bg-orange-600 px-5 py-2.5 text-xs uppercase font-bold tracking-wider text-white hover:bg-orange-700 active:scale-95 transition-all shadow-sm"
              >
                <Sparkles size={14} className="mr-1.5" />
                Browse Tasks
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

        {/* Profile Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Section 1: Academic Identity */}
          <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-2.5 mb-6 border-b border-neutral-100 pb-4">
              <GraduationCap className="text-orange-600" size={20} />
              <h2 className="text-base font-bold uppercase tracking-wider text-neutral-900">
                Academic Identity & Verification
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-mono font-bold text-neutral-700 uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Tarek Kammari"
                  className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-medium transition-all"
                  required
                />
              </div>

              {/* Student Email (Read only) */}
              <div>
                <label className="block text-xs font-mono font-bold text-neutral-700 uppercase tracking-wider mb-2">
                  Verified Academic Email
                </label>
                <input
                  type="email"
                  value={email}
                  readOnly
                  disabled
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-500 font-mono"
                />
              </div>

              {/* Dutch University Selection */}
              <div>
                <label className="block text-xs font-mono font-bold text-neutral-700 uppercase tracking-wider mb-2">
                  Dutch Research University
                </label>
                <select
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-medium transition-all bg-white"
                >
                  {DUTCH_UNIVERSITIES.map((uni) => (
                    <option key={uni} value={uni}>
                      {uni}
                    </option>
                  ))}
                </select>
              </div>

              {/* Field of Study */}
              <div>
                <label className="block text-xs font-mono font-bold text-neutral-700 uppercase tracking-wider mb-2">
                  Field of Study / Program
                </label>
                <input
                  type="text"
                  value={studyField}
                  onChange={(e) => setStudyField(e.target.value)}
                  placeholder="e.g. Computer Science & Artificial Intelligence"
                  className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-medium transition-all"
                  required
                />
              </div>

              {/* Year of Study */}
              <div>
                <label className="block text-xs font-mono font-bold text-neutral-700 uppercase tracking-wider mb-2">
                  Year of Study
                </label>
                <select
                  value={yearOfStudy}
                  onChange={(e) => setYearOfStudy(Number(e.target.value))}
                  className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-medium transition-all bg-white"
                >
                  <option value={1}>1st Year Bachelor (BSc)</option>
                  <option value={2}>2nd Year Bachelor (BSc)</option>
                  <option value={3}>3rd Year Bachelor (BSc)</option>
                  <option value={4}>1st Year Master (MSc)</option>
                  <option value={5}>2nd Year Master (MSc)</option>
                  <option value={6}>PhD Candidate</option>
                </select>
              </div>

              {/* Expected Rate */}
              <div>
                <label className="block text-xs font-mono font-bold text-neutral-700 uppercase tracking-wider mb-2">
                  Expected Rate (&euro;/hr)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">
                    &euro;
                  </span>
                  <input
                    type="number"
                    min={15}
                    max={200}
                    value={hourlyRateEur}
                    onChange={(e) => setHourlyRateEur(Number(e.target.value))}
                    className="w-full rounded-xl border border-neutral-200 pl-8 pr-4 py-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-medium transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Specializations & Skills */}
          <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-2.5 mb-6 border-b border-neutral-100 pb-4">
              <BookOpen className="text-orange-600" size={20} />
              <h2 className="text-base font-bold uppercase tracking-wider text-neutral-900">
                Specializations & Verified Skills
              </h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-mono font-bold text-neutral-700 uppercase tracking-wider mb-3">
                  Select Your Skill Badges
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {SKILLS_LIST.map((skill) => {
                    const active = skills.includes(skill);
                    return (
                      <button
                        type="button"
                        key={skill}
                        onClick={() => handleSkillToggle(skill)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${
                          active
                            ? "bg-orange-600 text-white shadow-sm"
                            : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                        }`}
                      >
                        {active ? "✓ " : "+ "}
                        {skill}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-mono font-bold text-neutral-700 uppercase tracking-wider mb-2">
                  Professional Bio / Executive Summary
                </label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Summarize your technical capabilities, academic highlights, and previous project experience for Netherlands enterprises..."
                  className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-normal transition-all"
                />
              </div>

              {/* Portfolio & LinkedIn */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-mono font-bold text-neutral-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Globe size={14} className="text-neutral-500" />
                    Portfolio / Website URL
                  </label>
                  <input
                    type="url"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    placeholder="https://yourportfolio.dev"
                    className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-medium transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-neutral-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Linkedin size={14} className="text-neutral-500" />
                    LinkedIn Profile URL
                  </label>
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-medium transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-end gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-xl bg-orange-600 px-8 py-3.5 text-xs uppercase font-bold tracking-widest text-white hover:bg-orange-700 active:scale-95 transition-all shadow-[0_4px_20px_rgba(249,115,22,0.3)] disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  Saving Profile...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  Save Academic Profile
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
