/**
 * src/lib/env.ts
 *
 * Centralised environment variable validation using Zod.
 *
 * Strategy:
 *  - Core variables (DB, Auth, Encryption) → required; validated at boot.
 *  - External service keys (Stripe, Resend, R2) → required in production,
 *    optional in development with a console warning. This lets you run
 *    `npm run dev` without setting up every third-party service first.
 *
 * Import this instead of accessing `process.env` directly:
 *   import { env } from "@/lib/env";
 *   const key = env.STRIPE_SECRET_KEY; // typed + validated
 */

import { z } from "zod";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isDev = process.env["NODE_ENV"] !== "production";

/**
 * Creates a field that is required in production but optional in development.
 * In development, missing values fall back to an empty string and log a warning.
 */
function prodRequired(fallback = "") {
  return isDev
    ? z.string().default(fallback)
    : z.string().min(1);
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const envSchema = z.object({
  // ── Node ──────────────────────────────────────────────────────────────────
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // ── App ───────────────────────────────────────────────────────────────────
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_NAME: z.string().default("TaskBridge NL"),

  // ── Database (always required — app cannot function without it) ───────────
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DIRECT_URL:   z.string().min(1, "DIRECT_URL is required"),

  // ── Auth (always required) ────────────────────────────────────────────────
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
  AUTH_URL:    z.string().url().default("http://localhost:3000"),

  // ── Stripe (required in production, warn in dev) ──────────────────────────
  STRIPE_SECRET_KEY:          prodRequired("sk_test_dev_placeholder"),
  STRIPE_WEBHOOK_SECRET:      prodRequired("whsec_dev_placeholder"),
  STRIPE_PLATFORM_FEE_PERCENT: z.coerce.number().min(0).max(50).default(10),

  // ── Email (required in production, warn in dev) ───────────────────────────
  RESEND_API_KEY: prodRequired("re_dev_placeholder"),
  EMAIL_FROM:     z.string().email().default("no-reply@taskbridge.nl"),

  // ── File Storage (fully optional — falls back gracefully) ─────────────────
  R2_ACCOUNT_ID:        z.string().optional(),
  R2_ACCESS_KEY_ID:     z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME:       z.string().optional(),
  R2_PUBLIC_URL:        z.string().url().optional(),

  // ── Rate Limiting (optional — falls back to in-memory) ───────────────────
  UPSTASH_REDIS_REST_URL:   z.string().url().optional().or(z.literal("")),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // ── Encryption (32-character key for AES-256) ─────────────────────────────
  FIELD_ENCRYPTION_KEY: isDev
    ? z.string().default("dev0123456789abcdef0123456789abc")
    : z.string().length(32, "FIELD_ENCRYPTION_KEY must be exactly 32 characters"),

  // ── Logging ───────────────────────────────────────────────────────────────
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
});

// ─── Parse & validate ─────────────────────────────────────────────────────────

const _parsed = envSchema.safeParse(process.env);

if (!_parsed.success) {
  // Format missing / invalid variables for a clear error message
  const issues = _parsed.error.issues
    .map((i) => `  • ${i.path.join(".")}: ${i.message}`)
    .join("\n");

  throw new Error(
    `\n❌ Invalid environment variables:\n${issues}\n\nSee .env.example for reference.\n` +
    `Copy .env.local from .env.example and fill in the required values.`
  );
}

export const env = _parsed.data;

// ─── Dev-mode warnings for optional service keys ──────────────────────────────
// These log once at startup so developers know which services aren't configured.

if (isDev) {
  const warnings: string[] = [];

  if (env.STRIPE_SECRET_KEY.includes("placeholder")) {
    warnings.push("STRIPE_SECRET_KEY — payment features disabled");
  }
  if (env.STRIPE_WEBHOOK_SECRET.includes("placeholder")) {
    warnings.push("STRIPE_WEBHOOK_SECRET — webhook processing disabled");
  }
  if (env.RESEND_API_KEY.includes("placeholder")) {
    warnings.push("RESEND_API_KEY — emails will be logged but not sent");
  }
  if (!env.R2_ACCOUNT_ID) {
    warnings.push("R2_ACCOUNT_ID — file uploads disabled");
  }
  if (!env.UPSTASH_REDIS_REST_URL) {
    warnings.push("UPSTASH_REDIS_REST_URL — using in-memory rate limiting");
  }

  if (warnings.length > 0) {
    console.warn(
      `\n⚠️  [TaskBridge] Running in dev mode with limited services:\n` +
      warnings.map((w) => `   ↳ ${w}`).join("\n") +
      `\n   See .env.local to configure them.\n`
    );
  }
}

// ─── Exported type ────────────────────────────────────────────────────────────
export type Env = typeof env;
