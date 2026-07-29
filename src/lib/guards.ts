/**
 * src/lib/guards.ts
 *
 * Server-side route guards for API Route Handlers.
 * Use these wrappers instead of manually checking sessions in every handler.
 *
 * Usage example:
 *   export const POST = withEnterprise(async (req, { session }) => {
 *     // session.user.role === "ENTERPRISE" is guaranteed here
 *   });
 */

import { auth } from "./auth";
import { unauthorized, forbidden } from "./api-response";
import { db } from "./db";
import { logger } from "./logger";
import type { NextRequest, NextResponse } from "next/server";
import type { UserRole } from "@prisma/client";
import type { Session } from "next-auth";

// ─── Types ────────────────────────────────────────────────────────────────────

type GuardedHandler<T = Record<string, string>> = (
  request: NextRequest,
  context: { session: Session; params: T }
) => Promise<NextResponse>;

// ─── Core guard factory ───────────────────────────────────────────────────────

/**
 * Creates a higher-order handler that:
 *  1. Validates the session.
 *  2. Checks the user role matches one of the allowed roles.
 *  3. Ensures the user is not banned.
 *  4. Passes the verified session to the inner handler.
 */
function createGuard(allowedRoles: UserRole[]) {
  return function withRole<T = Record<string, string>>(handler: GuardedHandler<T>) {
    return async (
      request: NextRequest,
      ctx: { params: Promise<T> }
    ): Promise<NextResponse> => {
      const session = await auth();

      // Not authenticated
      if (!session?.user) {
        return unauthorized() as NextResponse;
      }

      const { role, isBanned, id: userId } = session.user;

      // Account is banned
      if (isBanned) {
        logger.warn("[Guard] Banned user attempted access", { userId });
        return forbidden("Your account has been suspended.") as NextResponse;
      }

      // Role mismatch
      if (!allowedRoles.includes(role)) {
        logger.warn("[Guard] Role mismatch", { userId, role, allowedRoles });
        return forbidden("You do not have permission to perform this action.") as NextResponse;
      }

      const resolvedParams = ctx?.params ? await ctx.params : ({} as T);
      return handler(request, { session, params: resolvedParams });
    };
  };
}

// ─── Exported guards ──────────────────────────────────────────────────────────

/** Requires an authenticated session of any role. */
export const withAuth = createGuard(["STUDENT", "ENTERPRISE", "ADMIN"]);

/** Requires an authenticated STUDENT session. */
export const withStudent = createGuard(["STUDENT"]);

/** Requires an authenticated ENTERPRISE session. */
export const withEnterprise = createGuard(["ENTERPRISE"]);

/** Requires an authenticated ADMIN session. */
export const withAdmin = createGuard(["ADMIN"]);

/** Requires ADMIN or ENTERPRISE. */
export const withAdminOrEnterprise = createGuard(["ADMIN", "ENTERPRISE"]);

// ─── Ownership guard ──────────────────────────────────────────────────────────

/**
 * Verifies that the authenticated user owns the requested resource.
 * Admins bypass ownership checks.
 *
 * @param ownerId  - The userId that owns the resource.
 * @param session  - The current session.
 * @returns        - null if authorised, NextResponse(403) if not.
 */
export function checkOwnership(
  ownerId: string,
  session: Session
): NextResponse | null {
  if (session.user.role === "ADMIN") return null;
  if (session.user.id === ownerId) return null;
  return forbidden("You do not own this resource.") as NextResponse;
}

// ─── Task ownership helper ────────────────────────────────────────────────────

/**
 * Fetches a task and verifies the current user is the enterprise that posted it.
 * Returns the task if authorised, or a 403/404 response if not.
 */
export async function requireTaskOwner(
  taskId: string,
  userId: string
): Promise<{ task: Awaited<ReturnType<typeof db.task.findUnique>>; error: null } | { task: null; error: NextResponse }> {
  const task = await db.task.findUnique({ where: { id: taskId } });

  if (!task) {
    const { notFound } = await import("./api-response");
    return { task: null, error: notFound("Task") as NextResponse };
  }

  if (task.enterpriseId !== userId) {
    return { task: null, error: forbidden() as NextResponse };
  }

  return { task, error: null };
}
