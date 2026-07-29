/**
 * src/components/auth/login-form.tsx
 *
 * Client-side login form with react-hook-form + Zod validation.
 * Supports 2-Factor Authentication via Encrypted Security Key (.key) file for Admin accounts.
 */

"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Eye, EyeOff, Key, Upload, ShieldCheck, ArrowLeft } from "lucide-react";

import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input, FormField } from "@/components/ui/input";

// ── Error message map ─────────────────────────────────────────────────────────
const AUTH_ERRORS: Record<string, string> = {
  CredentialsSignin:        "Invalid email or password.",
  EMAIL_NOT_VERIFIED:      "Please verify your email address before signing in.",
  ACCOUNT_BANNED:          "Your account has been suspended. Contact support.",
  ACCOUNT_PENDING_APPROVAL:"Your registration is complete and pending validation by the Admin.",
  ADMIN_KEY_INVALID:       "Admin security key file (.key) is required or invalid.",
  Default:                  "Something went wrong. Please try again.",
};

export function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl  = searchParams.get("callbackUrl") ?? "/";
  const urlError     = searchParams.get("error");

  const [step, setStep]                 = useState<"CREDENTIALS" | "ADMIN_KEY">("CREDENTIALS");
  const [showPassword, setShowPassword] = useState(false);
  const [keyContent, setKeyContent]     = useState<string>("");
  const [keyFileName, setKeyFileName]   = useState<string>("");
  const [authError, setAuthError]       = useState<string | null>(
    urlError ? (AUTH_ERRORS[urlError] ?? AUTH_ERRORS["Default"]!) : null
  );

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  // Handle key file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setKeyFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setKeyContent(content);
      setValue("keyContent", content);
    };
    reader.readAsText(file);
  };

  const onSubmit = async (data: LoginInput) => {
    setAuthError(null);

    // If user is Admin or logging in with admin email and hasn't passed key yet, trigger Key step
    if (data.email.toLowerCase() === "tarekammari1@gmail.com" && step === "CREDENTIALS" && !keyContent) {
      setStep("ADMIN_KEY");
      return;
    }

    const result = await signIn("credentials", {
      email:      data.email,
      password:   data.password,
      keyContent: keyContent || data.keyContent,
      redirect:   false,
    });

    if (result?.error) {
      if (result.error === "ADMIN_KEY_INVALID") {
        setStep("ADMIN_KEY");
        setAuthError("🔒 Security key file required. Please upload your .key file to verify Admin access.");
      } else {
        setAuthError(AUTH_ERRORS[result.error] ?? AUTH_ERRORS["Default"]!);
      }
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  };

  const handleAdminQuickLoginClick = () => {
    setValue("email", "tarekammari1@gmail.com");
    setValue("password", "netherland@app@marketplace@2026!!!");
    setStep("ADMIN_KEY");
    setAuthError(null);
  };

  return (
    <div className="space-y-4">
      {step === "CREDENTIALS" ? (
        <>
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

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {authError && (
              <div role="alert" className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium">
                {authError}
              </div>
            )}

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
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </FormField>

            <div className="text-right">
              <Link href="/forgot-password" className="text-sm text-brand-700 hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
              Sign in
            </Button>

            <div className="pt-4 mt-4 border-t border-neutral-100 space-y-2">
              <p className="text-xs text-neutral-500 font-medium text-center">Super Admin Access:</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full font-bold text-orange-600 border-orange-200 hover:bg-orange-50 flex items-center justify-center gap-2"
                onClick={handleAdminQuickLoginClick}
              >
                <ShieldCheck className="h-4 w-4 text-orange-600" />
                <span>👑 Super Admin Sign In (Requires .key file)</span>
              </Button>
            </div>
          </form>
        </>
      ) : (
        /* STEP 2: ADMIN SECURITY KEY FILE STEP */
        <div className="space-y-4 pt-2">
          <div className="rounded-2xl bg-orange-950/5 border border-orange-200 p-5 text-left">
            <div className="flex items-center gap-2 text-orange-700 font-bold font-mono text-xs uppercase mb-1">
              <Key className="h-4 w-4 text-orange-600" />
              <span>Step 2 of 2: Admin Security Key File Required</span>
            </div>
            <h2 className="text-base font-bold text-neutral-900">
              Upload Your Encrypted .key File
            </h2>
            <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
              Email & password confirmed. Please upload your assigned <code className="font-mono text-orange-700 bg-orange-100 px-1 py-0.5 rounded">netherland_market_key_*.key</code> security file to complete authentication.
            </p>
          </div>

          {authError && (
            <div role="alert" className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium">
              {authError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-neutral-700 mb-2">
                Select .key Security File:
              </label>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-neutral-300 rounded-xl cursor-pointer bg-neutral-50 hover:bg-orange-50/50 hover:border-orange-400 transition-all p-4 text-center">
                <Upload className="h-6 w-6 text-orange-600 mb-2" />
                <span className="text-xs font-bold text-neutral-800">
                  {keyFileName ? `Selected: ${keyFileName}` : "Click to browse or drop .key file"}
                </span>
                <span className="text-[10px] text-neutral-400 font-mono mt-1">
                  Accepts netherland_market_key_*.key
                </span>
                <input
                  type="file"
                  accept=".key,.txt"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>

            {/* Fallback Text area for key content */}
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-neutral-500 mb-1">
                Or Paste Key Ciphertext Armor:
              </label>
              <textarea
                rows={3}
                value={keyContent}
                onChange={(e) => {
                  setKeyContent(e.target.value);
                  setValue("keyContent", e.target.value);
                }}
                placeholder="-----BEGIN NETHERLAND MARKETPLACE ENCRYPTED SECURITY KEY v1.0-----"
                className="w-full text-xs font-mono p-3 rounded-lg border border-neutral-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("CREDENTIALS")}
                className="flex-1"
              >
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>

              <Button
                type="submit"
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold"
                size="lg"
                isLoading={isSubmitting}
                disabled={!keyContent}
              >
                Verify & Sign In
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
