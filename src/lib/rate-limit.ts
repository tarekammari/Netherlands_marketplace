/**
 * src/lib/rate-limit.ts
 *
 * Rate limiting using Upstash Redis (serverless-compatible).
 * Falls back to a simple in-memory counter when Redis is not configured
 * (useful for local development without Redis).
 *
 * Usage:
 *   const result = await rateLimit("login", request);
 *   if (!result.success) return rateLimitResponse(result);
 */

import { NextRequest, NextResponse } from "next/server";
import { env } from "./env";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp
}

// ─── Limiters configuration ───────────────────────────────────────────────────
// Each limiter key maps to: { max requests, window in seconds }

const LIMITERS: Record<string, { max: number; window: number }> = {
  auth:       { max: 10,  window: 60  },  // 10 requests/minute (login, register)
  api:        { max: 100, window: 60  },  // 100 requests/minute (authenticated API)
  public:     { max: 300, window: 60  },  // 300 requests/minute (public search)
  webhook:    { max: 500, window: 60  },  // 500/minute (Stripe webhooks)
  upload:     { max: 20,  window: 3600 }, // 20 uploads/hour
};

// ─── In-memory fallback (development only) ────────────────────────────────────

const memoryStore = new Map<string, { count: number; reset: number }>();

function memoryRateLimit(key: string, max: number, windowSec: number): RateLimitResult {
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || entry.reset < now) {
    memoryStore.set(key, { count: 1, reset: now + windowSec * 1000 });
    return { success: true, limit: max, remaining: max - 1, reset: now + windowSec * 1000 };
  }

  entry.count++;
  const remaining = Math.max(0, max - entry.count);
  return { success: entry.count <= max, limit: max, remaining, reset: entry.reset };
}

// ─── Main rate limit function ─────────────────────────────────────────────────

/**
 * Applies a named rate limiter to an incoming request.
 * @param limiterName - One of the keys defined in LIMITERS above.
 * @param request     - The incoming Next.js request (used to extract client IP).
 */
export async function rateLimit(
  limiterName: keyof typeof LIMITERS,
  request: NextRequest
): Promise<RateLimitResult> {
  const config = LIMITERS[limiterName];
  if (!config) throw new Error(`Unknown rate limiter: ${limiterName}`);

  // Extract client IP from Cloudflare/Vercel/standard headers
  const ip =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0] ??
    "anonymous";

  const key = `rl:${limiterName}:${ip}`;

  // Use Upstash Redis if configured, else fall back to memory
  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      // Dynamic import avoids issues when package isn't installed
      const { Ratelimit } = await import("@upstash/ratelimit");
      const { Redis } = await import("@upstash/redis");

      const redis = new Redis({
        url: env.UPSTASH_REDIS_REST_URL,
        token: env.UPSTASH_REDIS_REST_TOKEN,
      });

      const limiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(config.max, `${config.window} s`),
      });

      const result = await limiter.limit(key);
      return {
        success:   result.success,
        limit:     result.limit,
        remaining: result.remaining,
        reset:     result.reset,
      };
    } catch {
      // Fail open: if Redis is down, allow the request
      console.error("[RateLimit] Redis unavailable, failing open");
      return { success: true, limit: config.max, remaining: config.max, reset: Date.now() };
    }
  }

  return memoryRateLimit(key, config.max, config.window);
}

/**
 * Returns a standardised 429 response with Retry-After headers.
 */
export function rateLimitResponse(result: RateLimitResult): NextResponse {
  const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);
  return NextResponse.json(
    { error: "Too many requests. Please slow down." },
    {
      status: 429,
      headers: {
        "Retry-After": retryAfter.toString(),
        "X-RateLimit-Limit": result.limit.toString(),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": result.reset.toString(),
      },
    }
  );
}
