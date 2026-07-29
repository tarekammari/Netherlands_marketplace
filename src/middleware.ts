/**
 * src/middleware.ts
 *
 * Next.js Edge Middleware — runs before every request on the CDN edge.
 *
 * IMPORTANT — Edge Runtime constraints:
 *  - No Node.js APIs (no fs, no crypto module, no Prisma).
 *  - Must only use Web-standard APIs and the NextAuth JWT helper.
 *  - All checks here are purely token-based (no DB calls).
 *
 * Responsibilities:
 *  1. Read the NextAuth JWT from the session cookie.
 *  2. Enforce role-based route access.
 *  3. Redirect unauthenticated users to /login.
 *  4. Redirect authenticated users away from auth pages.
 *  5. Block banned users at the token level.
 */

import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import type { UserRole } from "@prisma/client";

// ─── Route configuration ─────────────────────────────────────────────────────

/**
 * Route prefixes and the roles that are allowed to access them.
 * Any route not listed here is public (no auth required).
 */
const PROTECTED_ROUTES: Array<{ prefix: string; roles: UserRole[] }> = [
  { prefix: "/student",    roles: ["STUDENT"] },
  { prefix: "/enterprise", roles: ["ENTERPRISE"] },
  { prefix: "/admin",      roles: ["ADMIN"] },
  { prefix: "/messages",   roles: ["STUDENT", "ENTERPRISE", "ADMIN"] },
  { prefix: "/settings",   roles: ["STUDENT", "ENTERPRISE", "ADMIN"] },
];

/** Logged-in users are bounced away from these pages. */
const AUTH_ONLY_PAGES = ["/login", "/register"];

// ─── Role → home page map ────────────────────────────────────────────────────

const ROLE_HOME: Record<UserRole, string> = {
  STUDENT:    "/student/dashboard",
  ENTERPRISE: "/enterprise/dashboard",
  ADMIN:      "/admin",
};

// ─── Middleware ───────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const secret = process.env["AUTH_SECRET"] || process.env["NEXTAUTH_SECRET"] || "64_char_random_secret_string_for_taskbridge_nl_auth_secret_key_1234";

  // Find active session cookie dynamically
  const sessionCookie =
    request.cookies.get("__Secure-next-auth.session-token") ||
    request.cookies.get("next-auth.session-token") ||
    request.cookies.get("__Secure-authjs.session-token") ||
    request.cookies.get("authjs.session-token");

  // Read JWT from cookie — pure edge-compatible, no Prisma
  const token = (await getToken({
    req:          request,
    secret,
    cookieName:   sessionCookie?.name ?? "__Secure-next-auth.session-token",
    secureCookie: process.env.NODE_ENV === "production" || request.url.startsWith("https"),
  })) || (await getToken({
    req:          request,
    secret,
  }));

  const isLoggedIn = Boolean(token);
  const role       = token?.["role"] as UserRole | undefined;
  const isBanned   = token?.["isBanned"] as boolean | undefined;

  // ── 1. Block banned users ─────────────────────────────────────────────────
  if (isLoggedIn && isBanned) {
    return NextResponse.redirect(new URL("/banned", request.url));
  }

  // ── 2. Bounce logged-in users away from auth pages ────────────────────────
  if (isLoggedIn && role && AUTH_ONLY_PAGES.some((p) => pathname.startsWith(p))) {
    const home = ROLE_HOME[role] ?? "/";
    return NextResponse.redirect(new URL(home, request.url));
  }

  // ── 3. Enforce protected route access ─────────────────────────────────────
  const matchedRoute = PROTECTED_ROUTES.find((r) =>
    pathname.startsWith(r.prefix)
  );

  if (matchedRoute) {
    // Not logged in or missing valid role → redirect to login
    if (!isLoggedIn || !role) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Wrong role → redirect to their correct home
    if (role && !matchedRoute.roles.includes(role)) {
      return NextResponse.redirect(
        new URL(ROLE_HOME[role] ?? "/", request.url)
      );
    }
  }

  return NextResponse.next();
}

// ─── Route matcher ─────────────────────────────────────────────────────────────
// Exclude Next.js internals and static files from middleware.

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
