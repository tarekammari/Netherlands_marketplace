/**
 * src/app/(auth)/login/page.tsx
 * Login page with email/password credentials form.
 */

import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title:       "Log in",
  description: "Log in to your TaskBridge NL account.",
};

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-neutral-50">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-neutral-900">Welcome back</h1>
          <p className="text-neutral-500 mt-2 text-sm">
            Sign in to your TaskBridge NL account
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-8">
          <Suspense fallback={<div className="h-48 flex items-center justify-center text-sm text-neutral-500">Loading form...</div>}>
            <LoginForm />
          </Suspense>

          <p className="mt-6 text-center text-sm text-neutral-500">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-brand-700 font-medium hover:underline">
              Create one
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-neutral-400">
          By signing in you agree to our{" "}
          <Link href="/terms" className="hover:underline">Terms</Link>
          {" "}and{" "}
          <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}
