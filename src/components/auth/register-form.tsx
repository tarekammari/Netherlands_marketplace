/**
 * src/components/auth/register-form.tsx
 *
 * Dual-role registration form (Student & Enterprise)
 * Styled with clean, minimal design aesthetic inspired by skill-bid.vercel.app
 */

"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { GraduationCap, Building2, Eye, EyeOff, CheckCircle2 } from "lucide-react";

import {
  registerStudentSchema,
  registerEnterpriseSchema,
  type RegisterStudentInput,
  type RegisterEnterpriseInput,
} from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input, FormField } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/utils";

// ── Dutch Universities list for autosuggest/select ────────────────────────────

const DUTCH_UNIVERSITIES = [
  "Delft University of Technology (TU Delft)",
  "Eindhoven University of Technology (TU/e)",
  "University of Twente",
  "University of Amsterdam (UvA)",
  "Vrije Universiteit Amsterdam (VU)",
  "Utrecht University",
  "Leiden University",
  "Erasmus University Rotterdam",
  "Maastricht University",
  "University of Groningen",
  "Wageningen University & Research",
  "Radboud University Nijmegen",
  "Tilburg University",
  "Fontys University of Applied Sciences",
  "HU University of Applied Sciences Utrecht",
  "Saxion University of Applied Sciences",
  "Other Dutch Institution",
];

// ── Component ─────────────────────────────────────────────────────────────────

export function RegisterForm() {
  const searchParams = useSearchParams();
  const initialRole  = searchParams.get("role") === "enterprise" ? "ENTERPRISE" : "STUDENT";

  const [role, setRole]                 = useState<"STUDENT" | "ENTERPRISE">(initialRole);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [success, setSuccess]           = useState(false);
  const [isAutoVerified, setIsAutoVerified] = useState(false);

  // Student form
  const studentForm = useForm<RegisterStudentInput>({
    resolver: zodResolver(registerStudentSchema),
    defaultValues: { yearOfStudy: 3 },
  });

  // Enterprise form
  const enterpriseForm = useForm<RegisterEnterpriseInput>({
    resolver: zodResolver(registerEnterpriseSchema),
  });

  const onSubmit = async (data: Record<string, unknown>) => {
    setError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ...data, role }),
      });

      const json = await res.json() as { success: boolean; error?: string; autoVerified?: boolean };

      if (!res.ok || !json.success) {
        setError(json.error ?? "Registration failed. Please try again.");
        return;
      }

      setIsAutoVerified(!!json.autoVerified);
      setSuccess(true);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (success) {
    return (
      <div className="text-center py-6 space-y-4">
        <div className="h-14 w-14 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto border border-green-200">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900">
          {isAutoVerified ? "Account Verified!" : "Check your email"}
        </h2>
        <p className="text-sm text-neutral-600 max-w-sm mx-auto leading-relaxed">
          {isAutoVerified
            ? "Your account was automatically verified for development mode. You can log in directly."
            : "We've sent a verification link to your email address. Please click the link to activate your account."}
        </p>
        <div className="pt-4">
          <Button className="w-full" asChild>
            <Link href="/login">Go to Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Role Selector Tabs ── */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-100 rounded-xl">
        <button
          type="button"
          onClick={() => { setRole("STUDENT"); setError(null); }}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${
            role === "STUDENT"
              ? "bg-white text-neutral-900 shadow-sm"
              : "text-neutral-500 hover:text-neutral-900"
          }`}
        >
          <GraduationCap className="h-4 w-4 text-brand-700" />
          Student
        </button>

        <button
          type="button"
          onClick={() => { setRole("ENTERPRISE"); setError(null); }}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${
            role === "ENTERPRISE"
              ? "bg-white text-neutral-900 shadow-sm"
              : "text-neutral-500 hover:text-neutral-900"
          }`}
        >
          <Building2 className="h-4 w-4 text-brand-700" />
          Enterprise
        </button>
      </div>

      {/* Error alert */}
      {error && (
        <div role="alert" className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── Student Registration Form ── */}
      {role === "STUDENT" ? (
        <form onSubmit={studentForm.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField id="student-name" label="Full name" required error={studentForm.formState.errors.name?.message}>
            <Input id="student-name" placeholder="Sophie van den Berg" {...studentForm.register("name")} />
          </FormField>

          <FormField id="student-email" label="University email address" required error={studentForm.formState.errors.email?.message}>
            <Input id="student-email" type="email" placeholder="student@tue.nl" {...studentForm.register("email")} />
          </FormField>

          <FormField id="university" label="University / Institution" required error={studentForm.formState.errors.university?.message}>
            <select
              id="university"
              className="flex h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              {...studentForm.register("university")}
            >
              <option value="">Select your university...</option>
              {DUTCH_UNIVERSITIES.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField id="studyField" label="Field of study" required error={studentForm.formState.errors.studyField?.message}>
              <Input id="studyField" placeholder="Industrial Design" {...studentForm.register("studyField")} />
            </FormField>

            <FormField id="yearOfStudy" label="Year of study" required error={studentForm.formState.errors.yearOfStudy?.message}>
              <select
                id="yearOfStudy"
                className="flex h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                {...studentForm.register("yearOfStudy", { valueAsNumber: true })}
              >
                {[1, 2, 3, 4, 5, 6].map((yr) => (
                  <option key={yr} value={yr}>Year {yr}</option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField id="student-pass" label="Password" required error={studentForm.formState.errors.password?.message}>
            <div className="relative">
              <Input
                id="student-pass"
                type={showPassword ? "text" : "password"}
                placeholder="Minimum 8 characters"
                className="pr-10"
                {...studentForm.register("password")}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </FormField>

          <Button type="submit" className="w-full mt-2" size="lg" isLoading={studentForm.formState.isSubmitting}>
            Create Student Account
          </Button>
        </form>
      ) : (
        /* ── Enterprise Registration Form ── */
        <form onSubmit={enterpriseForm.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField id="contact-name" label="Contact person full name" required error={enterpriseForm.formState.errors.name?.message}>
            <Input id="contact-name" placeholder="Jan de Boer" {...enterpriseForm.register("name")} />
          </FormField>

          <FormField id="companyName" label="Company name" required error={enterpriseForm.formState.errors.companyName?.message}>
            <Input id="companyName" placeholder="Acme Corp NL" {...enterpriseForm.register("companyName")} />
          </FormField>

          <FormField id="ent-email" label="Company work email" required error={enterpriseForm.formState.errors.email?.message}>
            <Input id="ent-email" type="email" placeholder="jan@acmecorp.nl" {...enterpriseForm.register("email")} />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField id="kvkNumber" label="KVK Number (8 digits)" required error={enterpriseForm.formState.errors.kvkNumber?.message}>
              <Input id="kvkNumber" placeholder="12345678" maxLength={8} {...enterpriseForm.register("kvkNumber")} />
            </FormField>

            <FormField id="industry" label="Industry" required error={enterpriseForm.formState.errors.industry?.message}>
              <select
                id="industry"
                className="flex h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                {...enterpriseForm.register("industry")}
              >
                <option value="">Select industry...</option>
                {["Technology", "Finance", "Marketing", "Consulting", "Healthcare", "E-commerce", "Other"].map((ind) => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField id="ent-pass" label="Password" required error={enterpriseForm.formState.errors.password?.message}>
            <div className="relative">
              <Input
                id="ent-pass"
                type={showPassword ? "text" : "password"}
                placeholder="Minimum 8 characters"
                className="pr-10"
                {...enterpriseForm.register("password")}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </FormField>

          <Button type="submit" className="w-full mt-2" size="lg" isLoading={enterpriseForm.formState.isSubmitting}>
            Create Enterprise Account
          </Button>
        </form>
      )}
    </div>
  );
}
