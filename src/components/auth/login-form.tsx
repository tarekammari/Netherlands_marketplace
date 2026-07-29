/**
 * src/components/auth/login-form.tsx
 *
 * 2-Step Clean Authentication Form.
 * Step 1: Validates Email & Password.
 * Step 2: Demands Security Key File (.key) for Admin accounts. Completely hides key contents.
 */

"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Eye, EyeOff, Key, Upload, ShieldCheck, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";

import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input, FormField } from "@/components/ui/input";

const AUTH_ERRORS: Record<string, string> = {
  CredentialsSignin:        "Invalid email or password.",
  EMAIL_NOT_VERIFIED:      "Please verify your email address before signing in.",
  ACCOUNT_BANNED:          "Your account has been suspended.",
  ACCOUNT_PENDING_APPROVAL:"Your registration is pending admin validation.",
  ADMIN_KEY_INVALID:       "Invalid or missing .key security file.",
  Default:                  "Authentication failed. Please check your credentials.",
};

export function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl  = searchParams.get("callbackUrl") ?? "/";
  const urlError     = searchParams.get("error");

  const [step, setStep]                 = useState<"CREDENTIALS" | "ADMIN_KEY">("CREDENTIALS");
  const [showPassword, setShowPassword] = useState(false);
  const [verifying, setVerifying]       = useState(false);
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

  // Handle key file selection without showing plain text key
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setKeyFileName(file.name);
    setAuthError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setKeyContent(content);
      setValue("keyContent", content);
    };
    reader.readAsText(file);
  };

  // Step 1: Validate Email & Password upfront
  const onStep1Submit = async (data: LoginInput) => {
    setAuthError(null);
    setVerifying(true);

    try {
      const res = await fetch("/api/auth/verify-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, password: data.password }),
      });

      const verifyData = await res.json();

      if (!res.ok || !verifyData.valid) {
        setAuthError(verifyData.error || "Invalid email or password.");
        setVerifying(false);
        return;
      }

      // If Admin requires key file -> Proceed to Step 2
      if (verifyData.requiresKey) {
        setStep("ADMIN_KEY");
        setVerifying(false);
        return;
      }

      // Regular non-admin login
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setAuthError(AUTH_ERRORS[result.error] ?? AUTH_ERRORS["Default"]!);
        setVerifying(false);
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setAuthError("Failed to connect to authentication server.");
    } finally {
      setVerifying(false);
    }
  };

  // Step 2: Final Admin Key Authentication
  const onStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!keyContent) {
      setAuthError("Please select your .key security file.");
      return;
    }

    const email = getValues("email");
    const password = getValues("password");

    const result = await signIn("credentials", {
      email,
      password,
      keyContent,
      redirect: false,
    });

    if (result?.error) {
      setAuthError(AUTH_ERRORS[result.error] ?? "Invalid security key file.");
      return;
    }

    router.push("/admin");
    router.refresh();
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

          <form onSubmit={handleSubmit(onStep1Submit)} className="space-y-4" noValidate>
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

            <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting || verifying}>
              Sign in
            </Button>
          </form>
        </>
      ) : (
        /* STEP 2: MINIMALIST CLEAN KEY FILE UPLOAD STEP */
        <div className="space-y-5 pt-1 text-center">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-orange-100 border border-orange-300 flex items-center justify-center text-orange-600 mb-3 shadow-sm">
              <Key className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-bold text-neutral-900">Admin Key Required</h2>
            <p className="text-xs text-neutral-500 mt-1 font-mono">
              Upload your security key file to complete login
            </p>
          </div>

          {authError && (
            <div role="alert" className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium text-left">
              {authError}
            </div>
          )}

          <form onSubmit={onStep2Submit} className="space-y-4">
            <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-neutral-300 rounded-2xl cursor-pointer bg-neutral-50 hover:bg-orange-50/50 hover:border-orange-500 transition-all p-5 shadow-sm">
              {keyFileName ? (
                <div className="flex flex-col items-center gap-1.5 text-emerald-700">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600 animate-bounce" />
                  <span className="text-xs font-bold font-mono">{keyFileName}</span>
                  <span className="text-[10px] text-emerald-600 font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Encrypted Key Loaded
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1 text-neutral-600">
                  <Upload className="h-7 w-7 text-orange-600 mb-1" />
                  <span className="text-xs font-bold text-neutral-800">
                    Upload .key File
                  </span>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    Select netherland_market_key_*.key
                  </span>
                </div>
              )}
              <input
                type="file"
                accept=".key,.txt"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>

            <div className="flex items-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStep("CREDENTIALS");
                  setKeyContent("");
                  setKeyFileName("");
                  setAuthError(null);
                }}
                className="w-1/3"
              >
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>

              <Button
                type="submit"
                className="w-2/3 bg-orange-600 hover:bg-orange-700 text-white font-bold"
                size="lg"
                disabled={!keyContent}
              >
                Sign In
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
