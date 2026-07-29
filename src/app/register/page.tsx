/**
 * src/app/register/page.tsx
 * Registration page for Dutch Students & Enterprises.
 */

import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";
import { ShieldCheck, FileCheck, Banknote } from "lucide-react";

export const metadata: Metadata = {
  title:       "Create an Account",
  description: "Join TaskBridge NL as a student or enterprise.",
};

export default function RegisterPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-neutral-50">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-neutral-900">Create your account</h1>
          <p className="text-neutral-500 mt-2 text-sm">
            Join the Netherlands&apos; contract-first student task marketplace
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-8">
          <Suspense fallback={<div className="h-48 flex items-center justify-center text-sm text-neutral-500">Loading form...</div>}>
            <RegisterForm />
          </Suspense>

          {/* Value props */}
          <div className="mt-8 border-t border-neutral-100 pt-6 grid grid-cols-3 gap-3 text-center text-xs text-neutral-500">
            <div className="space-y-1">
              <ShieldCheck className="h-4 w-4 text-brand-700 mx-auto" />
              <p className="font-medium text-neutral-700">Verified</p>
              <p>KYC &amp; KVK checked</p>
            </div>
            <div className="space-y-1">
              <FileCheck className="h-4 w-4 text-brand-700 mx-auto" />
              <p className="font-medium text-neutral-700">Contracts</p>
              <p>Auto PDF generated</p>
            </div>
            <div className="space-y-1">
              <Banknote className="h-4 w-4 text-brand-700 mx-auto" />
              <p className="font-medium text-neutral-700">Escrow</p>
              <p>100% payout safety</p>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-neutral-500">
            Already have an account?{" "}
            <Link href="/login" className="text-brand-700 font-medium hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
