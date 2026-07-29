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
  CredentialsSignin:        "Invalid email or password.",
  EMAIL_NOT_VERIFIED:      "Please verify your email address before signing in.",
  ACCOUNT_BANNED:          "Your account has been suspended. Contact support.",
  ACCOUNT_PENDING_APPROVAL:"Your registration is complete and pending validation by the Admin.",
  Default:                  "Something went wrong. Please try again.",
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

  const handleAdminQuickLogin = async () => {
    setAuthError(null);
    setValue("email", "tarekammari1@gmail.com");
    setValue("password", "netherland@app@marketplace@2026!!!");

    const result = await signIn("credentials", {
      email: "tarekammari1@gmail.com",
      password: "netherland@app@marketplace@2026!!!",
      redirect: false,
    });

    if (result?.error) {
      setAuthError(AUTH_ERRORS[result.error] ?? AUTH_ERRORS["Default"]!);
      return;
    }

    router.push("/admin");
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {/* Google Sign In / Subscribe Option */}
      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl })}
        className="w-full flex items-center justify-center gap-3 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50 active:scale-[0.99] transition-all"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>Continue / Subscribe with Google</span>
      </button>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-neutral-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-neutral-400 font-mono">Or sign in with email</span>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
        noValidate
      >
        {/* Auth error */}
        {authError && (
          <div
            role="alert"
            className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium"
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
            placeholder="tarekammari1@gmail.com"
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

        {/* Quick Super Admin Sign-In */}
        <div className="pt-4 mt-4 border-t border-neutral-100 space-y-2">
          <p className="text-xs text-neutral-500 font-medium text-center">Super Admin Quick Access:</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full font-bold text-orange-600 border-orange-200 hover:bg-orange-50"
            onClick={handleAdminQuickLogin}
          >
            👑 Sign In as Super Admin (tarekammari1@gmail.com)
          </Button>
        </div>
      </form>
    </div>
  );
}
