/**
 * src/components/auth/login-form.tsx
 *
 * Client-side login form with react-hook-form + Zod validation.
 * Calls NextAuth signIn → redirects on success.
 */

"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input, FormField } from "@/components/ui/input";

// ── Error message map ─────────────────────────────────────────────────────────
const AUTH_ERRORS: Record<string, string> = {
  CredentialsSignin:   "Invalid email or password.",
  EMAIL_NOT_VERIFIED: "Please verify your email address before signing in.",
  ACCOUNT_BANNED:     "Your account has been suspended. Contact support.",
  Default:             "Something went wrong. Please try again.",
};

// ── Component ─────────────────────────────────────────────────────────────────

export function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl  = searchParams.get("callbackUrl") ?? "/";
  const urlError     = searchParams.get("error");

  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError]       = useState<string | null>(
    urlError ? (AUTH_ERRORS[urlError] ?? AUTH_ERRORS["Default"]!) : null
  );

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setAuthError(null);

    const result = await signIn("credentials", {
      email:    data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      setAuthError(AUTH_ERRORS[result.error] ?? AUTH_ERRORS["Default"]!);
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  };

  const handleQuickDemo = async (email: string, password: string, defaultRedirect: string) => {
    setAuthError(null);
    setValue("email", email);
    setValue("password", password);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setAuthError(AUTH_ERRORS[result.error] ?? AUTH_ERRORS["Default"]!);
      return;
    }

    const destination = callbackUrl !== "/" ? callbackUrl : defaultRedirect;
    router.push(destination);
    router.refresh();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
      noValidate
    >
      {/* Auth error */}
      {authError && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
        >
          {authError}
        </div>
      )}

      {/* Email */}
      <FormField id="email" label="Email address" required error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          autoFocus
          placeholder="you@university.nl"
          error={!!errors.email}
          {...register("email")}
        />
      </FormField>

      {/* Password */}
      <FormField id="password" label="Password" required error={errors.password?.message}>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            error={!!errors.password}
            className="pr-10"
            {...register("password")}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </FormField>

      {/* Forgot password */}
      <div className="text-right">
        <Link
          href="/forgot-password"
          className="text-sm text-brand-700 hover:underline"
        >
          Forgot password?
        </Link>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        className="w-full"
        size="lg"
        isLoading={isSubmitting}
      >
        Sign in
      </Button>

      {/* Quick Demo Sign-In */}
      <div className="pt-4 mt-4 border-t border-neutral-100 space-y-2">
        <p className="text-xs text-neutral-500 font-medium text-center">Quick Demo Sign-In:</p>
        <div className="grid grid-cols-3 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleQuickDemo("enterprise@acmecorp.nl", "Test@1234!", "/enterprise/dashboard")}
          >
            🏢 Enterprise
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleQuickDemo("student@tue.nl", "Test@1234!", "/student/dashboard")}
          >
            🎓 Student
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleQuickDemo("admin@taskbridge.nl", "Admin@1234!", "/admin")}
          >
            👑 Admin
          </Button>
        </div>
      </div>
    </form>
  );
}
